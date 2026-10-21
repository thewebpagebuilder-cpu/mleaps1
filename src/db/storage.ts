import fs from "fs";
import path from "path";
import * as dbModule from "./index";
const db = dbModule.db;
import { questions, candidateAssignments, examAttempts, Question, CandidateAssignment, ExamAttempt } from "./schema";
import { INITIAL_SIX_SIGMA_QUESTIONS } from "./seed-data";
import { asc, desc, eq, count } from "drizzle-orm";

interface PlatformDataStore {
  questions: Question[];
  assignments: CandidateAssignment[];
  attempts: ExamAttempt[];
}

let memoryStore: PlatformDataStore | null = null;
let postgresHealthy: boolean | null = null;

function getStoreFilePath(): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "platform-store.json");
}

function buildInitialData(): PlatformDataStore {
  const now = new Date();
  const hourMs = 3600 * 1000;
  const dayMs = 24 * hourMs;

  const initialQuestions: Question[] = INITIAL_SIX_SIGMA_QUESTIONS.map((q, idx) => ({
    id: idx + 1,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
    dmaicPhase: q.dmaicPhase || "Define",
    createdAt: new Date(now.getTime() - 2 * dayMs),
    updatedAt: new Date(now.getTime() - 2 * dayMs),
  }));

  const initialAssignments: CandidateAssignment[] = [
    {
      id: 1,
      candidateName: "Demo Candidate (Fake Profile)",
      candidateEmail: "fake.candidate@mleaps.com",
      validFrom: new Date(now.getTime() - 10 * 60 * 1000), // active right now
      validUntil: new Date(now.getTime() + 48 * hourMs), // active for 48 hours
      durationMinutes: 40,
      status: "assigned",
      notes: "Fake candidate profile active for 48 hours to take the Six Sigma Green Belt mock test.",
      createdAt: new Date(now.getTime() - 10 * 60 * 1000),
    },
    {
      id: 2,
      candidateName: "Alex Rivera",
      candidateEmail: "alex.rivera@mleaps.com",
      validFrom: new Date(now.getTime() - 10 * 60 * 1000),
      validUntil: new Date(now.getTime() + 48 * hourMs), // active for 48 hours
      durationMinutes: 40,
      status: "assigned",
      notes: "Six Sigma Green Belt Wave 1 — Active 48-Hour Assessment Window",
      createdAt: new Date(now.getTime() - 2 * hourMs),
    },
    {
      id: 3,
      candidateName: "Priya Nair",
      candidateEmail: "priya.nair@mleaps.com",
      validFrom: new Date(now.getTime() - 5 * 60 * 1000),
      validUntil: new Date(now.getTime() + 48 * hourMs),
      durationMinutes: 40,
      status: "assigned",
      notes: "Operational Excellence Cohort — Active Authorized Window",
      createdAt: new Date(now.getTime() - 1 * hourMs),
    },
    {
      id: 4,
      candidateName: "Marcus Vance",
      candidateEmail: "marcus.vance@mleaps.com",
      validFrom: new Date(now.getTime() + 24 * hourMs),
      validUntil: new Date(now.getTime() + 4 * dayMs),
      durationMinutes: 40,
      status: "assigned",
      notes: "Scheduled Future Assessment Slot (Opens in 24 Hours)",
      createdAt: new Date(now.getTime() - 3 * hourMs),
    },
    {
      id: 5,
      candidateName: "Elena Rostova",
      candidateEmail: "elena.rostova@mleaps.com",
      validFrom: new Date(now.getTime() - 4 * dayMs),
      validUntil: new Date(now.getTime() - 12 * hourMs),
      durationMinutes: 40,
      status: "assigned",
      notes: "Prior Assessment Cohort (Window Expired)",
      createdAt: new Date(now.getTime() - 4 * dayMs),
    },
    {
      id: 6,
      candidateName: "Dr. Siddharth Mehta",
      candidateEmail: "siddharth.mehta@mleaps.com",
      validFrom: new Date(now.getTime() - 2 * dayMs),
      validUntil: new Date(now.getTime() + 2 * dayMs),
      durationMinutes: 40,
      status: "completed",
      notes: "Senior Process Lead — Completed Assessment",
      createdAt: new Date(now.getTime() - 2 * dayMs),
    },
    {
      id: 7,
      candidateName: "Claire Dupont",
      candidateEmail: "claire.dupont@mleaps.com",
      validFrom: new Date(now.getTime() - 3 * dayMs),
      validUntil: new Date(now.getTime() + 1 * dayMs),
      durationMinutes: 40,
      status: "completed",
      notes: "Quality Assurance Specialist — Completed Assessment",
      createdAt: new Date(now.getTime() - 3 * dayMs),
    },
    {
      id: 8,
      candidateName: "Devon Brooks",
      candidateEmail: "devon.brooks@mleaps.com",
      validFrom: new Date(now.getTime() - 2 * dayMs),
      validUntil: new Date(now.getTime() + 1 * dayMs),
      durationMinutes: 40,
      status: "completed",
      notes: "Manufacturing Analyst — Completed Assessment",
      createdAt: new Date(now.getTime() - 2 * dayMs),
    },
  ];

  const siddharthAnswers: Record<string, string> = {};
  const claireAnswers: Record<string, string> = {};
  const devonAnswers: Record<string, string> = {};

  initialQuestions.forEach((q, idx) => {
    const wrong = q.correctOption === "A" ? "B" : q.correctOption === "B" ? "C" : q.correctOption === "C" ? "A" : "B";
    siddharthAnswers[String(q.id)] = (idx === 7 || idx === 18) ? wrong : q.correctOption;
    claireAnswers[String(q.id)] = (idx % 4 === 3) ? wrong : q.correctOption;
    devonAnswers[String(q.id)] = (idx % 2 === 1 && idx < 22) ? wrong : q.correctOption;
  });

  const initialAttempts: ExamAttempt[] = [
    {
      id: 1,
      assignmentId: 6,
      candidateName: "Dr. Siddharth Mehta",
      candidateEmail: "siddharth.mehta@mleaps.com",
      score: 23,
      totalQuestions: 25,
      percentage: 92,
      passed: true,
      answers: siddharthAnswers,
      timeSpentSeconds: 1640,
      startedAt: new Date(now.getTime() - 18 * hourMs),
      submittedAt: new Date(now.getTime() - 17.5 * hourMs),
    },
    {
      id: 2,
      assignmentId: 7,
      candidateName: "Claire Dupont",
      candidateEmail: "claire.dupont@mleaps.com",
      score: 19,
      totalQuestions: 25,
      percentage: 76,
      passed: true,
      answers: claireAnswers,
      timeSpentSeconds: 2015,
      startedAt: new Date(now.getTime() - 10 * hourMs),
      submittedAt: new Date(now.getTime() - 9.4 * hourMs),
    },
    {
      id: 3,
      assignmentId: 8,
      candidateName: "Devon Brooks",
      candidateEmail: "devon.brooks@mleaps.com",
      score: 14,
      totalQuestions: 25,
      percentage: 56,
      passed: false,
      answers: devonAnswers,
      timeSpentSeconds: 2290,
      startedAt: new Date(now.getTime() - 5 * hourMs),
      submittedAt: new Date(now.getTime() - 4.3 * hourMs),
    },
  ];

  return {
    questions: initialQuestions,
    assignments: initialAssignments,
    attempts: initialAttempts,
  };
}

function loadFileStore(): PlatformDataStore {
  if (memoryStore) return memoryStore;
  const filePath = getStoreFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      // Re-hydrate dates
      parsed.questions = (parsed.questions || []).map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      }));
      parsed.assignments = (parsed.assignments || []).map((a: any) => ({
        ...a,
        validFrom: new Date(a.validFrom),
        validUntil: new Date(a.validUntil),
        createdAt: new Date(a.createdAt),
      }));
      parsed.attempts = (parsed.attempts || []).map((at: any) => ({
        ...at,
        startedAt: new Date(at.startedAt),
        submittedAt: new Date(at.submittedAt),
      }));

      // Ensure fake.candidate profile exists and is active for 48h
      const hasFakeProfile = parsed.assignments.some(
        (a: any) => a.candidateEmail === "fake.candidate@mleaps.com"
      );
      if (!hasFakeProfile) {
        const now = new Date();
        const nextId = parsed.assignments.length > 0
          ? Math.max(...parsed.assignments.map((a: any) => a.id)) + 1
          : 1;
        parsed.assignments.unshift({
          id: nextId,
          candidateName: "Demo Candidate (Fake Profile)",
          candidateEmail: "fake.candidate@mleaps.com",
          validFrom: new Date(now.getTime() - 10 * 60 * 1000),
          validUntil: new Date(now.getTime() + 48 * 3600 * 1000),
          durationMinutes: 40,
          status: "assigned",
          notes: "Fake candidate profile active for 48 hours to take the Six Sigma Green Belt mock test.",
          createdAt: new Date(now.getTime() - 10 * 60 * 1000),
        });
        saveFileStore(parsed);
      }

      memoryStore = parsed;
      return memoryStore!;
    }
  } catch (err) {
    console.error("Failed to load local file store, resetting:", err);
  }

  const initial = buildInitialData();
  saveFileStore(initial);
  memoryStore = initial;
  return memoryStore;
}

function saveFileStore(data: PlatformDataStore) {
  memoryStore = data;
  try {
    const filePath = getStoreFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to file store:", err);
  }
}

async function isPostgresAvailable(): Promise<boolean> {
  if (postgresHealthy !== null) return postgresHealthy;
  try {
    if (typeof (dbModule as any).ensureDbReady === "function") {
      await (dbModule as any).ensureDbReady();
    }
    const pool = (dbModule as any).pool;
    if (pool && typeof pool.query === "function") {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 1200)
      );
      const checkPromise = pool.query("SELECT 1");
      await Promise.race([checkPromise, timeoutPromise]);
      postgresHealthy = true;
      return true;
    }
    if (db) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 1200)
      );
      await Promise.race([db.select({ value: count() }).from(questions), timeoutPromise]);
      postgresHealthy = true;
      return true;
    }
    postgresHealthy = false;
    return false;
  } catch {
    postgresHealthy = false;
    return false;
  }
}

export async function ensurePlatformSeeded(): Promise<void> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [{ value: qCount }] = await db.select({ value: count() }).from(questions);
      if (qCount === 0) {
        await db.insert(questions).values(INITIAL_SIX_SIGMA_QUESTIONS);
      }

      const [{ value: aCount }] = await db.select({ value: count() }).from(candidateAssignments);
      if (aCount === 0) {
        const now = new Date();
        const hourMs = 3600 * 1000;
        await db.insert(candidateAssignments).values([
          {
            candidateName: "Demo Candidate (Fake Profile)",
            candidateEmail: "fake.candidate@mleaps.com",
            validFrom: new Date(now.getTime() - 10 * 60 * 1000),
            validUntil: new Date(now.getTime() + 48 * hourMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Fake candidate profile active for 48 hours to take the Six Sigma Green Belt mock test.",
          },
          {
            candidateName: "Alex Rivera",
            candidateEmail: "alex.rivera@mleaps.com",
            validFrom: new Date(now.getTime() - 10 * 60 * 1000),
            validUntil: new Date(now.getTime() + 48 * hourMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Six Sigma Green Belt Wave 1 — Active 48-Hour Assessment Window",
          },
          {
            candidateName: "Priya Nair",
            candidateEmail: "priya.nair@mleaps.com",
            validFrom: new Date(now.getTime() - 5 * 60 * 1000),
            validUntil: new Date(now.getTime() + 48 * hourMs),
            durationMinutes: 40,
            status: "assigned",
            notes: "Operational Excellence Cohort — Active Authorized Window",
          },
        ]);
      }
      return;
    } catch (e) {
      console.warn("Postgres seed error, falling back to local store:", e);
      postgresHealthy = false;
    }
  }

  // Local storage initialization
  loadFileStore();
}

// ================= QUESTION OPERATIONS =================
export async function getQuestions(): Promise<Question[]> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      await ensurePlatformSeeded();
      return await db
        .select()
        .from(questions)
        .orderBy(asc(questions.questionNumber), asc(questions.id));
    } catch (e) {
      console.warn("Falling back to local questions:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  return [...store.questions].sort((a, b) => a.questionNumber - b.questionNumber || a.id - b.id);
}

export async function createQuestion(data: {
  questionNumber?: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  dmaicPhase?: string;
}): Promise<Question> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const existing = await db.select().from(questions);
      const nextNumber =
        typeof data.questionNumber === "number" && data.questionNumber > 0
          ? data.questionNumber
          : existing.length + 1;

      const [created] = await db
        .insert(questions)
        .values({
          questionNumber: nextNumber,
          questionText: String(data.questionText).trim(),
          optionA: String(data.optionA).trim(),
          optionB: String(data.optionB).trim(),
          optionC: String(data.optionC).trim(),
          optionD: String(data.optionD).trim(),
          correctOption: String(data.correctOption).toUpperCase().slice(0, 1),
          explanation: String(data.explanation || "Official Six Sigma Green Belt evaluation criteria.").trim(),
          dmaicPhase: String(data.dmaicPhase || "Define").trim(),
        })
        .returning();
      return created;
    } catch (e) {
      console.warn("Falling back to local create question:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const nextId = store.questions.length > 0 ? Math.max(...store.questions.map((q) => q.id)) + 1 : 1;
  const nextNum =
    typeof data.questionNumber === "number" && data.questionNumber > 0
      ? data.questionNumber
      : store.questions.length + 1;

  const now = new Date();
  const newQuestion: Question = {
    id: nextId,
    questionNumber: nextNum,
    questionText: String(data.questionText).trim(),
    optionA: String(data.optionA).trim(),
    optionB: String(data.optionB).trim(),
    optionC: String(data.optionC).trim(),
    optionD: String(data.optionD).trim(),
    correctOption: String(data.correctOption).toUpperCase().slice(0, 1),
    explanation: String(data.explanation || "Official Six Sigma Green Belt evaluation criteria.").trim(),
    dmaicPhase: String(data.dmaicPhase || "Define").trim(),
    createdAt: now,
    updatedAt: now,
  };

  store.questions.push(newQuestion);
  saveFileStore(store);
  return newQuestion;
}

export async function updateQuestion(
  id: number,
  data: Partial<Omit<Question, "id" | "createdAt" | "updatedAt">>
): Promise<Question | null> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [updated] = await db
        .update(questions)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id))
        .returning();
      return updated || null;
    } catch (e) {
      console.warn("Falling back to local update question:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const idx = store.questions.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  store.questions[idx] = {
    ...store.questions[idx],
    ...data,
    updatedAt: new Date(),
  };
  saveFileStore(store);
  return store.questions[idx];
}

export async function deleteQuestion(id: number): Promise<boolean> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [deleted] = await db.delete(questions).where(eq(questions.id, id)).returning();
      return !!deleted;
    } catch (e) {
      console.warn("Falling back to local delete question:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const initLen = store.questions.length;
  store.questions = store.questions.filter((q) => q.id !== id);
  if (store.questions.length !== initLen) {
    saveFileStore(store);
    return true;
  }
  return false;
}

export async function resetQuestionsToDefaults(): Promise<Question[]> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      await db.delete(questions);
      const inserted = await db.insert(questions).values(INITIAL_SIX_SIGMA_QUESTIONS).returning();
      return inserted;
    } catch (e) {
      console.warn("Falling back to local reset questions:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const now = new Date();
  store.questions = INITIAL_SIX_SIGMA_QUESTIONS.map((q, idx) => ({
    id: idx + 1,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
    dmaicPhase: q.dmaicPhase || "Define",
    createdAt: now,
    updatedAt: now,
  }));
  saveFileStore(store);
  return store.questions;
}

// ================= ASSIGNMENT OPERATIONS =================
export async function getAssignments(): Promise<CandidateAssignment[]> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      await ensurePlatformSeeded();
      return await db
        .select()
        .from(candidateAssignments)
        .orderBy(desc(candidateAssignments.createdAt));
    } catch (e) {
      console.warn("Falling back to local assignments:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  return [...store.assignments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createAssignment(data: {
  candidateName: string;
  candidateEmail: string;
  validFrom: Date;
  validUntil: Date;
  durationMinutes?: number;
  notes?: string | null;
}): Promise<CandidateAssignment> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [created] = await db
        .insert(candidateAssignments)
        .values({
          candidateName: String(data.candidateName).trim(),
          candidateEmail: String(data.candidateEmail).trim().toLowerCase(),
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          durationMinutes: Number(data.durationMinutes) || 40,
          status: "assigned",
          notes: data.notes ? String(data.notes).trim() : null,
        })
        .returning();
      return created;
    } catch (e) {
      console.warn("Falling back to local create assignment:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const nextId = store.assignments.length > 0 ? Math.max(...store.assignments.map((a) => a.id)) + 1 : 1;
  const newAssignment: CandidateAssignment = {
    id: nextId,
    candidateName: String(data.candidateName).trim(),
    candidateEmail: String(data.candidateEmail).trim().toLowerCase(),
    validFrom: new Date(data.validFrom),
    validUntil: new Date(data.validUntil),
    durationMinutes: Number(data.durationMinutes) || 40,
    status: "assigned",
    notes: data.notes ? String(data.notes).trim() : null,
    createdAt: new Date(),
  };

  store.assignments.unshift(newAssignment);
  saveFileStore(store);
  return newAssignment;
}

export async function updateAssignment(
  id: number,
  payload: {
    candidateName?: string;
    candidateEmail?: string;
    validFrom?: string | Date;
    validUntil?: string | Date;
    durationMinutes?: number;
    status?: string;
    notes?: string | null;
    quickAction?: "activate_now_48h" | "extend_24h" | "reset_retake";
  }
): Promise<CandidateAssignment | null> {
  const now = new Date();
  const hourMs = 3600 * 1000;

  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      let updateData: any = {};
      if (payload.quickAction === "activate_now_48h") {
        updateData = {
          validFrom: new Date(now.getTime() - 5 * 60 * 1000),
          validUntil: new Date(now.getTime() + 48 * hourMs),
          status: "assigned",
        };
      } else if (payload.quickAction === "extend_24h") {
        const existing = await db
          .select()
          .from(candidateAssignments)
          .where(eq(candidateAssignments.id, id));
        const baseTime =
          existing[0] && new Date(existing[0].validUntil) > now
            ? new Date(existing[0].validUntil)
            : now;
        updateData = {
          validUntil: new Date(baseTime.getTime() + 24 * hourMs),
        };
      } else if (payload.quickAction === "reset_retake") {
        updateData = {
          status: "assigned",
          validFrom: new Date(now.getTime() - 5 * 60 * 1000),
          validUntil: new Date(now.getTime() + 48 * hourMs),
        };
      } else {
        if (payload.candidateName !== undefined) updateData.candidateName = String(payload.candidateName).trim();
        if (payload.candidateEmail !== undefined) updateData.candidateEmail = String(payload.candidateEmail).trim().toLowerCase();
        if (payload.validFrom !== undefined) updateData.validFrom = new Date(payload.validFrom);
        if (payload.validUntil !== undefined) updateData.validUntil = new Date(payload.validUntil);
        if (payload.durationMinutes !== undefined) updateData.durationMinutes = Number(payload.durationMinutes) || 40;
        if (payload.status !== undefined) updateData.status = String(payload.status);
        if (payload.notes !== undefined) updateData.notes = payload.notes ? String(payload.notes).trim() : null;
      }

      const [updated] = await db
        .update(candidateAssignments)
        .set(updateData)
        .where(eq(candidateAssignments.id, id))
        .returning();
      return updated || null;
    } catch (e) {
      console.warn("Falling back to local update assignment:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const idx = store.assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const current = store.assignments[idx];
  let updatedFields: Partial<CandidateAssignment> = {};

  if (payload.quickAction === "activate_now_48h") {
    updatedFields = {
      validFrom: new Date(now.getTime() - 5 * 60 * 1000),
      validUntil: new Date(now.getTime() + 48 * hourMs),
      status: "assigned",
    };
  } else if (payload.quickAction === "extend_24h") {
    const baseTime = new Date(current.validUntil) > now ? new Date(current.validUntil) : now;
    updatedFields = {
      validUntil: new Date(baseTime.getTime() + 24 * hourMs),
    };
  } else if (payload.quickAction === "reset_retake") {
    updatedFields = {
      status: "assigned",
      validFrom: new Date(now.getTime() - 5 * 60 * 1000),
      validUntil: new Date(now.getTime() + 48 * hourMs),
    };
  } else {
    if (payload.candidateName !== undefined) updatedFields.candidateName = String(payload.candidateName).trim();
    if (payload.candidateEmail !== undefined) updatedFields.candidateEmail = String(payload.candidateEmail).trim().toLowerCase();
    if (payload.validFrom !== undefined) updatedFields.validFrom = new Date(payload.validFrom);
    if (payload.validUntil !== undefined) updatedFields.validUntil = new Date(payload.validUntil);
    if (payload.durationMinutes !== undefined) updatedFields.durationMinutes = Number(payload.durationMinutes) || 40;
    if (payload.status !== undefined) updatedFields.status = String(payload.status);
    if (payload.notes !== undefined) updatedFields.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  store.assignments[idx] = {
    ...current,
    ...updatedFields,
  };

  saveFileStore(store);
  return store.assignments[idx];
}

export async function deleteAssignment(id: number): Promise<boolean> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [deleted] = await db.delete(candidateAssignments).where(eq(candidateAssignments.id, id)).returning();
      return !!deleted;
    } catch (e) {
      console.warn("Falling back to local delete assignment:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const initLen = store.assignments.length;
  store.assignments = store.assignments.filter((a) => a.id !== id);
  if (store.assignments.length !== initLen) {
    saveFileStore(store);
    return true;
  }
  return false;
}

export async function verifyCandidateAssignment(
  rawEmail: string,
  candidateNameInput?: string
): Promise<{
  allowed: boolean;
  code:
    | "ACCESS_GRANTED"
    | "UNASSIGNED_EMAIL"
    | "WINDOW_NOT_OPEN"
    | "WINDOW_EXPIRED"
    | "ALREADY_COMPLETED"
    | "INVALID_INPUT"
    | "SERVER_ERROR";
  message: string;
  assignment?: CandidateAssignment;
  latestAttempt?: ExamAttempt | null;
}> {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) {
    return {
      allowed: false,
      code: "INVALID_INPUT",
      message: "Please enter your assigned candidate email address.",
    };
  }

  const allAssignments = await getAssignments();
  const matching = allAssignments.filter(
    (a) => a.candidateEmail.toLowerCase() === email
  );

  if (matching.length === 0) {
    return {
      allowed: false,
      code: "UNASSIGNED_EMAIL",
      message: `Access Denied: The email "${email}" has not been assigned by the Mleaps Assessment Administrator. Only pre-authorized candidates may attempt this examination.`,
    };
  }

  const now = new Date();

  // Find active assignment
  const activeAssignment = matching.find((a) => {
    const from = new Date(a.validFrom);
    const until = new Date(a.validUntil);
    return a.status !== "completed" && now >= from && now <= until;
  });

  if (activeAssignment) {
    if (candidateNameInput && candidateNameInput.trim() !== activeAssignment.candidateName) {
      const updated = await updateAssignment(activeAssignment.id, {
        candidateName: candidateNameInput.trim(),
      });
      return {
        allowed: true,
        code: "ACCESS_GRANTED",
        assignment: updated || activeAssignment,
        message: "Identity and active 48-hour time window verified. You are authorized to begin the Six Sigma Green Belt Certification Assessment.",
      };
    }
    return {
      allowed: true,
      code: "ACCESS_GRANTED",
      assignment: activeAssignment,
      message: "Identity and active 48-hour time window verified. You are authorized to begin the Six Sigma Green Belt Certification Assessment.",
    };
  }

  // Inspect latest assignment for specific status
  const latest = matching[0];
  const from = new Date(latest.validFrom);
  const until = new Date(latest.validUntil);

  if (latest.status === "completed") {
    const attempts = await getAttempts();
    const candidateAttempts = attempts.filter((at) => at.candidateEmail.toLowerCase() === email);
    return {
      allowed: false,
      code: "ALREADY_COMPLETED",
      assignment: latest,
      latestAttempt: candidateAttempts[0] || null,
      message: "You have already completed and submitted your assigned assessment attempt. You can review your official scorecard below or ask the Administrator to reset your window for a retake.",
    };
  }

  if (now < from) {
    return {
      allowed: false,
      code: "WINDOW_NOT_OPEN",
      assignment: latest,
      message: `Your assigned examination window has not opened yet. You are scheduled to take this test between ${from.toLocaleString()} and ${until.toLocaleString()}.`,
    };
  }

  if (now > until) {
    return {
      allowed: false,
      code: "WINDOW_EXPIRED",
      assignment: latest,
      message: `Your assigned assessment time window expired on ${until.toLocaleString()}. Please contact the Mleaps Administrator to extend your window.`,
    };
  }

  return {
    allowed: true,
    code: "ACCESS_GRANTED",
    assignment: latest,
    message: "Access granted.",
  };
}

// ================= ATTEMPT OPERATIONS =================
export async function getAttempts(): Promise<ExamAttempt[]> {
  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      await ensurePlatformSeeded();
      return await db
        .select()
        .from(examAttempts)
        .orderBy(desc(examAttempts.submittedAt));
    } catch (e) {
      console.warn("Falling back to local attempts:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  return [...store.attempts].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export async function submitExamAttempt(data: {
  assignmentId?: number | null;
  candidateName: string;
  candidateEmail: string;
  answers: Record<string, string>;
  timeSpentSeconds?: number;
  startedAt?: string | Date;
}): Promise<{ attempt: ExamAttempt; questions: Question[] }> {
  const allQuestions = await getQuestions();
  const totalQuestions = allQuestions.length || 25;
  let score = 0;

  const normalizedAnswers: Record<string, string> = {};
  for (const q of allQuestions) {
    const chosen = data.answers[String(q.id)] || data.answers[q.id];
    if (chosen) {
      const cleanChosen = String(chosen).toUpperCase().slice(0, 1);
      normalizedAnswers[String(q.id)] = cleanChosen;
      if (cleanChosen === q.correctOption.toUpperCase()) {
        score += 1;
      }
    }
  }

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= 70;
  const now = new Date();

  const pgOk = await isPostgresAvailable();
  if (pgOk) {
    try {
      const [createdAttempt] = await db
        .insert(examAttempts)
        .values({
          assignmentId: data.assignmentId ? Number(data.assignmentId) : null,
          candidateName: String(data.candidateName).trim(),
          candidateEmail: String(data.candidateEmail).trim().toLowerCase(),
          score,
          totalQuestions,
          percentage,
          passed,
          answers: normalizedAnswers,
          timeSpentSeconds: Number(data.timeSpentSeconds) || 0,
          startedAt: data.startedAt ? new Date(data.startedAt) : now,
          submittedAt: now,
        })
        .returning();

      if (data.assignmentId) {
        await db
          .update(candidateAssignments)
          .set({ status: "completed" })
          .where(eq(candidateAssignments.id, Number(data.assignmentId)));
      }

      return { attempt: createdAttempt, questions: allQuestions };
    } catch (e) {
      console.warn("Falling back to local submit attempt:", e);
      postgresHealthy = false;
    }
  }

  const store = loadFileStore();
  const nextId = store.attempts.length > 0 ? Math.max(...store.attempts.map((a) => a.id)) + 1 : 1;

  const newAttempt: ExamAttempt = {
    id: nextId,
    assignmentId: data.assignmentId ? Number(data.assignmentId) : null,
    candidateName: String(data.candidateName).trim(),
    candidateEmail: String(data.candidateEmail).trim().toLowerCase(),
    score,
    totalQuestions,
    percentage,
    passed,
    answers: normalizedAnswers,
    timeSpentSeconds: Number(data.timeSpentSeconds) || 0,
    startedAt: data.startedAt ? new Date(data.startedAt) : now,
    submittedAt: now,
  };

  store.attempts.unshift(newAttempt);

  if (data.assignmentId) {
    const aIdx = store.assignments.findIndex((a) => a.id === Number(data.assignmentId));
    if (aIdx !== -1) {
      store.assignments[aIdx].status = "completed";
    }
  }

  saveFileStore(store);
  return { attempt: newAttempt, questions: allQuestions };
}
