import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidateAssignments, examAttempts } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const assignments = await db
      .select()
      .from(candidateAssignments)
      .orderBy(desc(candidateAssignments.createdAt));

    const attempts = await db
      .select()
      .from(examAttempts)
      .orderBy(desc(examAttempts.submittedAt));

    return NextResponse.json({ assignments, attempts });
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const {
      candidateName,
      candidateEmail,
      validFrom,
      validUntil,
      durationMinutes,
      notes,
    } = body;

    if (!candidateName || !candidateEmail || !validFrom || !validUntil) {
      return NextResponse.json(
        {
          error:
            "Candidate name, email, valid-from time, and valid-until time are required.",
        },
        { status: 400 }
      );
    }

    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(untilDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid start or end date/time format." },
        { status: 400 }
      );
    }

    if (untilDate <= fromDate) {
      return NextResponse.json(
        {
          error:
            "The end time (Valid Until) must be later than the start time (Valid From).",
        },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(candidateAssignments)
      .values({
        candidateName: String(candidateName).trim(),
        candidateEmail: String(candidateEmail).trim().toLowerCase(),
        validFrom: fromDate,
        validUntil: untilDate,
        durationMinutes: Number(durationMinutes) || 40,
        status: "assigned",
        notes: notes ? String(notes).trim() : null,
      })
      .returning();

    return NextResponse.json({ assignment: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to create candidate assignment" },
      { status: 500 }
    );
  }
}
