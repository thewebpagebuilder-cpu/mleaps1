import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const questionId = Number(id);
    if (!questionId || Number.isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      questionNumber,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      dmaicPhase,
    } = body;

    const [updated] = await db
      .update(questions)
      .set({
        ...(questionNumber !== undefined
          ? { questionNumber: Number(questionNumber) }
          : {}),
        ...(questionText !== undefined
          ? { questionText: String(questionText).trim() }
          : {}),
        ...(optionA !== undefined ? { optionA: String(optionA).trim() } : {}),
        ...(optionB !== undefined ? { optionB: String(optionB).trim() } : {}),
        ...(optionC !== undefined ? { optionC: String(optionC).trim() } : {}),
        ...(optionD !== undefined ? { optionD: String(optionD).trim() } : {}),
        ...(correctOption !== undefined
          ? { correctOption: String(correctOption).toUpperCase().slice(0, 1) }
          : {}),
        ...(explanation !== undefined
          ? { explanation: String(explanation).trim() }
          : {}),
        ...(dmaicPhase !== undefined
          ? { dmaicPhase: String(dmaicPhase).trim() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error("PUT /api/questions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
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
    const questionId = Number(id);
    if (!questionId || Number.isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, questionId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
