import { db } from "./index";
import { questions, candidateAssignments, examAttempts } from "./schema";
import { INITIAL_SIX_SIGMA_QUESTIONS } from "./seed-data";
import { count, asc } from "drizzle-orm";

let isSeeding = false;

export async function ensureSeeded() {
  if (isSeeding) return;
  try {
    const [{ value: questionCount }] = await db
      .select({ value: count() })
      .from(questions);

    if (questionCount === 0) {
      isSeeding = true;
      await db.insert(questions).values(INITIAL_SIX_SIGMA_QUESTIONS);
    }

    const [{ value: assignmentCount }] = await db
      .select({ value: count() })
      .from(candidateAssignments);

    if (assignmentCount === 0) {
      isSeeding = true;
      const now = new Date();
      const hourMs = 3600 * 1000;
      const dayMs = 24 * hourMs;

      const allQuestions = await db
        .select()
        .from(questions)
        .orderBy(asc(questions.questionNumber));

      const insertedAssignments = await db
        .insert(candidateAssignments)
        .values([
          {
            candidateName: "Alex Rivera",
            candidateEmail: "alex.rivera@mleaps.com",
            validFrom: new Date(now.getTime() - 2 * hourMs),
            validUntil: new Date(now.getTime() + 7 * dayMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Six Sigma Green Belt Wave 1 — Active Authorized Window",
          },
          {
            candidateName: "Priya Nair",
            candidateEmail: "priya.nair@mleaps.com",
            validFrom: new Date(now.getTime() - 1 * hourMs),
            validUntil: new Date(now.getTime() + 3 * dayMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Operational Excellence Cohort — Active Authorized Window",
          },
          {
            candidateName: "Marcus Vance",
            candidateEmail: "marcus.vance@mleaps.com",
            validFrom: new Date(now.getTime() + 24 * hourMs),
            validUntil: new Date(now.getTime() + 4 * dayMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Scheduled Future Assessment Slot (Opens in 24 Hours)",
          },
          {
            candidateName: "Elena Rostova",
            candidateEmail: "elena.rostova@mleaps.com",
            validFrom: new Date(now.getTime() - 4 * dayMs),
            validUntil: new Date(now.getTime() - 12 * hourMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Prior Assessment Cohort (Window Expired)",
          },
          {
            candidateName: "Dr. Siddharth Mehta",
            candidateEmail: "siddharth.mehta@mleaps.com",
            validFrom: new Date(now.getTime() - 2 * dayMs),
            validUntil: new Date(now.getTime() + 2 * dayMs),
            durationMinutes: 40,
            status: "completed",
            notes: "Senior Process Lead — Completed Assessment",
          },
          {
            candidateName: "Claire Dupont",
            candidateEmail: "claire.dupont@mleaps.com",
            validFrom: new Date(now.getTime() - 3 * dayMs),
            validUntil: new Date(now.getTime() + 1 * dayMs),
            durationMinutes: 40,
            status: "completed",
            notes: "Quality Assurance Specialist — Completed Assessment",
          },
          {
            candidateName: "Devon Brooks",
            candidateEmail: "devon.brooks@mleaps.com",
            validFrom: new Date(now.getTime() - 2 * dayMs),
            validUntil: new Date(now.getTime() + 1 * dayMs),
            durationMinutes: 40,
            status: "completed",
            notes: "Manufacturing Analyst — Completed Assessment",
          },
        ])
        .returning();

      const [{ value: attemptCount }] = await db
        .select({ value: count() })
        .from(examAttempts);

      if (attemptCount === 0 && allQuestions.length > 0) {
        // Build realistic answer maps keyed by question ID
        const siddharthAnswers: Record<string, string> = {};
        const claireAnswers: Record<string, string> = {};
        const devonAnswers: Record<string, string> = {};

        allQuestions.forEach((q, idx) => {
          const wrongOption =
            q.correctOption === "A"
              ? "B"
              : q.correctOption === "B"
              ? "C"
              : q.correctOption === "C"
              ? "A"
              : "B";

          // Siddharth gets 23/25 correct (misses #8 and #19)
          siddharthAnswers[String(q.id)] =
            idx === 7 || idx === 18 ? wrongOption : q.correctOption;

          // Claire gets 19/25 correct (misses 6 questions)
          claireAnswers[String(q.id)] =
            idx % 4 === 3 ? wrongOption : q.correctOption;

          // Devon gets 14/25 correct (misses 11 questions)
          devonAnswers[String(q.id)] =
            idx % 2 === 1 && idx < 22 ? wrongOption : q.correctOption;
        });

        const siddharthAssignment = insertedAssignments.find(
          (a) => a.candidateEmail === "siddharth.mehta@mleaps.com"
        );
        const claireAssignment = insertedAssignments.find(
          (a) => a.candidateEmail === "claire.dupont@mleaps.com"
        );
        const devonAssignment = insertedAssignments.find(
          (a) => a.candidateEmail === "devon.brooks@mleaps.com"
        );

        await db.insert(examAttempts).values([
          {
            assignmentId: siddharthAssignment?.id ?? null,
            candidateName: "Dr. Siddharth Mehta",
            candidateEmail: "siddharth.mehta@mleaps.com",
            score: 23,
            totalQuestions: 25,
            percentage: 92,
            passed: true,
            answers: siddharthAnswers,
            timeSpentSeconds: 1640, // 27m 20s
            startedAt: new Date(now.getTime() - 18 * hourMs),
            submittedAt: new Date(now.getTime() - 17.5 * hourMs),
          },
          {
            assignmentId: claireAssignment?.id ?? null,
            candidateName: "Claire Dupont",
            candidateEmail: "claire.dupont@mleaps.com",
            score: 19,
            totalQuestions: 25,
            percentage: 76,
            passed: true,
            answers: claireAnswers,
            timeSpentSeconds: 2015, // 33m 35s
            startedAt: new Date(now.getTime() - 10 * hourMs),
            submittedAt: new Date(now.getTime() - 9.4 * hourMs),
          },
          {
            assignmentId: devonAssignment?.id ?? null,
            candidateName: "Devon Brooks",
            candidateEmail: "devon.brooks@mleaps.com",
            score: 14,
            totalQuestions: 25,
            percentage: 56,
            passed: false,
            answers: devonAnswers,
            timeSpentSeconds: 2290, // 38m 10s
            startedAt: new Date(now.getTime() - 5 * hourMs),
            submittedAt: new Date(now.getTime() - 4.3 * hourMs),
          },
        ]);
      }
    }
  } catch (err) {
    console.error("Seed check error:", err);
  } finally {
    isSeeding = false;
  }
}
