import { NextRequest, NextResponse } from "next/server";
import {
  getQuestions,
  createQuestion,
  resetQuestionsToDefaults,
} from "@/db/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allQuestions = await getQuestions();
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
    const body = await request.json();

    if (body.action === "reset_defaults") {
      const restored = await resetQuestionsToDefaults();
      return NextResponse.json({
        message: "Restored canonical 25 Six Sigma Green Belt questions",
        questions: restored,
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

    const created = await createQuestion({
      questionNumber:
        typeof questionNumber === "number" && questionNumber > 0
          ? questionNumber
          : undefined,
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
    });

    return NextResponse.json({ question: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
