import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { INITIAL_SIX_SIGMA_QUESTIONS } from "@/db/seed-data";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.questionNumber), asc(questions.id));

    return NextResponse.json({ questions: allQuestions });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();

    if (body.action === "reset_defaults") {
      await db.delete(questions);
      const inserted = await db
        .insert(questions)
        .values(INITIAL_SIX_SIGMA_QUESTIONS)
        .returning();
      return NextResponse.json({
        message: "Restored canonical 25 Six Sigma Green Belt questions",
        questions: inserted,
      });
    }

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

    if (
      !questionText ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !correctOption
    ) {
      return NextResponse.json(
        { error: "All question fields and options A-D are required." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.questionNumber));
    const nextNumber =
      typeof questionNumber === "number" && questionNumber > 0
        ? questionNumber
        : existing.length + 1;

    const [created] = await db
      .insert(questions)
      .values({
        questionNumber: nextNumber,
        questionText: String(questionText).trim(),
        optionA: String(optionA).trim(),
        optionB: String(optionB).trim(),
        optionC: String(optionC).trim(),
        optionD: String(optionD).trim(),
        correctOption: String(correctOption).toUpperCase().slice(0, 1),
        explanation: String(
          explanation || "Official Six Sigma Green Belt evaluation criteria."
        ).trim(),
        dmaicPhase: String(dmaicPhase || "Define").trim(),
      })
      .returning();

    return NextResponse.json({ question: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
