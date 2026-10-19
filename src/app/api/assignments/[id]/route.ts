import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidateAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const assignmentId = Number(id);
    if (!assignmentId || Number.isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      candidateName,
      candidateEmail,
      validFrom,
      validUntil,
      durationMinutes,
      status,
      notes,
      quickAction,
    } = body;

    const now = new Date();
    const hourMs = 3600 * 1000;

    let updatePayload: Partial<typeof candidateAssignments.$inferInsert> = {};

    if (quickAction === "activate_now_48h") {
      updatePayload = {
        validFrom: new Date(now.getTime() - 5 * 60 * 1000),
        validUntil: new Date(now.getTime() + 48 * hourMs),
        status: "assigned",
      };
    } else if (quickAction === "extend_24h") {
      const existing = await db
        .select()
        .from(candidateAssignments)
        .where(eq(candidateAssignments.id, assignmentId));
      const baseTime =
        existing[0] && new Date(existing[0].validUntil) > now
          ? new Date(existing[0].validUntil)
          : now;
      updatePayload = {
        validUntil: new Date(baseTime.getTime() + 24 * hourMs),
      };
    } else if (quickAction === "reset_retake") {
      updatePayload = {
        status: "assigned",
        validFrom: new Date(now.getTime() - 5 * 60 * 1000),
        validUntil: new Date(now.getTime() + 48 * hourMs),
      };
    } else {
      if (candidateName !== undefined)
        updatePayload.candidateName = String(candidateName).trim();
      if (candidateEmail !== undefined)
        updatePayload.candidateEmail = String(candidateEmail)
          .trim()
          .toLowerCase();
      if (validFrom !== undefined)
        updatePayload.validFrom = new Date(validFrom);
      if (validUntil !== undefined)
        updatePayload.validUntil = new Date(validUntil);
      if (durationMinutes !== undefined)
        updatePayload.durationMinutes = Number(durationMinutes) || 40;
      if (status !== undefined) updatePayload.status = String(status);
      if (notes !== undefined)
        updatePayload.notes = notes ? String(notes).trim() : null;
    }

    const [updated] = await db
      .update(candidateAssignments)
      .set(updatePayload)
      .where(eq(candidateAssignments.id, assignmentId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("PUT /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const assignmentId = Number(id);
    if (!assignmentId || Number.isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(candidateAssignments)
      .where(eq(candidateAssignments.id, assignmentId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
