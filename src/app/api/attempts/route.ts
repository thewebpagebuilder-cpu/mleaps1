import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidateAssignments, examAttempts, questions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const attempts = await db
      .select()
      .from(examAttempts)
      .orderBy(desc(examAttempts.submittedAt));

    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.questionNumber), asc(questions.id));

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
    await ensureSeeded();
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

    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.questionNumber), asc(questions.id));

    const totalQuestions = allQuestions.length || 25;
    let score = 0;

    const normalizedAnswers: Record<string, string> = {};
    for (const q of allQuestions) {
      const chosen = answers[String(q.id)] || answers[q.id];
      if (chosen) {
        const cleanChosen = String(chosen).toUpperCase().slice(0, 1);
        normalizedAnswers[String(q.id)] = cleanChosen;
        if (cleanChosen === q.correctOption.toUpperCase()) {
          score += 1;
        }
      }
    }

    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= 70;

    const [createdAttempt] = await db
      .insert(examAttempts)
      .values({
        assignmentId: assignmentId ? Number(assignmentId) : null,
        candidateName: String(candidateName).trim(),
        candidateEmail: String(candidateEmail).trim().toLowerCase(),
        score,
        totalQuestions,
        percentage,
        passed,
        answers: normalizedAnswers,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        submittedAt: new Date(),
      })
      .returning();

    if (assignmentId) {
      await db
        .update(candidateAssignments)
        .set({ status: "completed" })
        .where(eq(candidateAssignments.id, Number(assignmentId)));
    }

    return NextResponse.json(
      {
        attempt: createdAttempt,
        questions: allQuestions,
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
