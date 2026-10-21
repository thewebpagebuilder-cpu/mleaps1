import { NextRequest, NextResponse } from "next/server";
import { getAttempts, getQuestions, submitExamAttempt } from "@/db/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [attempts, allQuestions] = await Promise.all([
      getAttempts(),
      getQuestions(),
    ]);

    return NextResponse.json({ attempts, questions: allQuestions });
  } catch (error) {
    console.error("GET /api/attempts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam attempts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      candidateName,
      candidateEmail,
      answers,
      timeSpentSeconds,
      startedAt,
    } = body;

    if (!candidateName || !candidateEmail || !answers) {
      return NextResponse.json(
        { error: "Candidate details and answers are required." },
        { status: 400 }
      );
    }

    const { attempt, questions } = await submitExamAttempt({
      assignmentId: assignmentId ? Number(assignmentId) : null,
      candidateName: String(candidateName).trim(),
      candidateEmail: String(candidateEmail).trim().toLowerCase(),
      answers,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      startedAt,
    });

    return NextResponse.json(
      {
        attempt,
        questions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/attempts error:", error);
    return NextResponse.json(
      { error: "Failed to submit and grade exam attempt" },
      { status: 500 }
    );
  }
}
