import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidateAssignments, examAttempts } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const rawEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const candidateNameInput = String(body.candidateName || "").trim();

    if (!rawEmail) {
      return NextResponse.json(
        {
          allowed: false,
          code: "INVALID_INPUT",
          message: "Please enter your assigned candidate email address.",
        },
        { status: 400 }
      );
    }

    const matchingAssignments = await db
      .select()
      .from(candidateAssignments)
      .where(eq(candidateAssignments.candidateEmail, rawEmail))
      .orderBy(desc(candidateAssignments.createdAt));

    if (matchingAssignments.length === 0) {
      return NextResponse.json({
        allowed: false,
        code: "UNASSIGNED_EMAIL",
        message: `Access Denied: The email "${rawEmail}" has not been assigned by the Mleaps Consulting Assessment Administrator. Only pre-authorized candidates may attempt this examination.`,
      });
    }

    const now = new Date();

    // Check if there is an active, uncompleted assignment right now
    const activeAssignment = matchingAssignments.find((a) => {
      const from = new Date(a.validFrom);
      const until = new Date(a.validUntil);
      return a.status !== "completed" && now >= from && now <= until;
    });

    if (activeAssignment) {
      // Optionally update candidateName if user supplied a refined name
      if (
        candidateNameInput &&
        candidateNameInput !== activeAssignment.candidateName
      ) {
        const [updated] = await db
          .update(candidateAssignments)
          .set({ candidateName: candidateNameInput })
          .where(eq(candidateAssignments.id, activeAssignment.id))
          .returning();
        return NextResponse.json({
          allowed: true,
          code: "ACCESS_GRANTED",
          assignment: updated,
          message:
            "Identity and active time-window verified. You are authorized to begin the Six Sigma Green Belt Certification Assessment.",
        });
      }

      return NextResponse.json({
        allowed: true,
        code: "ACCESS_GRANTED",
        assignment: activeAssignment,
        message:
          "Identity and active time-window verified. You are authorized to begin the Six Sigma Green Belt Certification Assessment.",
      });
    }

    // Otherwise inspect the most recent assignment to give a precise reason
    const latest = matchingAssignments[0];
    const from = new Date(latest.validFrom);
    const until = new Date(latest.validUntil);

    if (latest.status === "completed") {
      const attempts = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.candidateEmail, rawEmail))
        .orderBy(desc(examAttempts.submittedAt));

      return NextResponse.json({
        allowed: false,
        code: "ALREADY_COMPLETED",
        assignment: latest,
        latestAttempt: attempts[0] || null,
        message:
          "You have already completed and submitted your assigned assessment attempt. You can review your official scorecard below or ask the Administrator to reset your window for a retake.",
      });
    }

    if (now < from) {
      return NextResponse.json({
        allowed: false,
        code: "WINDOW_NOT_OPEN",
        assignment: latest,
        message: `Your assigned examination window has not opened yet. You are scheduled to take this test between ${from.toLocaleString()} and ${until.toLocaleString()}.`,
      });
    }

    if (now > until) {
      return NextResponse.json({
        allowed: false,
        code: "WINDOW_EXPIRED",
        assignment: latest,
        message: `Your assigned assessment time window expired on ${until.toLocaleString()}. Please contact the Mleaps Consulting Administrator to extend your window.`,
      });
    }

    return NextResponse.json({
      allowed: true,
      code: "ACCESS_GRANTED",
      assignment: latest,
      message: "Access granted.",
    });
  } catch (error) {
    console.error("POST /api/assignments/verify error:", error);
    return NextResponse.json(
      {
        allowed: false,
        code: "SERVER_ERROR",
        message: "Failed to verify candidate assignment.",
      },
      { status: 500 }
    );
  }
}
