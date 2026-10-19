import {
  pgTable,
  serial,
  text,
  integer,
  varchar,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: varchar("correct_option", { length: 1 }).notNull(),
  explanation: text("explanation").notNull(),
  dmaicPhase: varchar("dmaic_phase", { length: 32 }).notNull().default("Define"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const candidateAssignments = pgTable("candidate_assignments", {
  id: serial("id").primaryKey(),
  candidateName: varchar("candidate_name", { length: 255 }).notNull(),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(40),
  status: varchar("status", { length: 32 }).notNull().default("assigned"), // 'assigned' | 'in_progress' | 'completed'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(
    () => candidateAssignments.id,
    { onDelete: "set null" }
  ),
  candidateName: varchar("candidate_name", { length: 255 }).notNull(),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: integer("percentage").notNull(),
  passed: boolean("passed").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  startedAt: timestamp("started_at").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type CandidateAssignment = typeof candidateAssignments.$inferSelect;
export type NewCandidateAssignment = typeof candidateAssignments.$inferInsert;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type NewExamAttempt = typeof examAttempts.$inferInsert;
