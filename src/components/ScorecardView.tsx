"use client";

import React, { useState } from "react";
import { ExamAttempt, Question } from "@/db/schema";
import { MleapsLogo } from "./MleapsLogo";
import { AnimatedCheckIcon, AnimatedCrossIcon } from "./SixSigmaVisuals";
import {
  Award,
  Clock,
  Calendar,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Filter,
  Printer,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface ScorecardViewProps {
  attempt: ExamAttempt;
  questions: Question[];
  onBack: () => void;
  backLabel?: string;
}

export function ScorecardView({
  attempt,
  questions,
  onBack,
  backLabel = "Back to Portal",
}: ScorecardViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "incorrect">(
    "all"
  );
  const [selectedPhase, setSelectedPhase] = useState<string>("All");

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem}s`;
  };

  // Compute DMAIC phase breakdown
  const phases = ["Define", "Measure", "Analyze", "Improve", "Control"];
  const phaseStats = phases.map((phase) => {
    const phaseQs = questions.filter((q) => q.dmaicPhase === phase);
    let correct = 0;
    for (const q of phaseQs) {
      const userAns = attempt.answers?.[String(q.id)];
      if (userAns && userAns.toUpperCase() === q.correctOption.toUpperCase()) {
        correct += 1;
      }
    }
    const pct =
      phaseQs.length > 0 ? Math.round((correct / phaseQs.length) * 100) : 0;
    return {
      phase,
      correct,
      total: phaseQs.length,
      pct,
    };
  });

  const filteredQuestions = questions.filter((q) => {
    const userAns = attempt.answers?.[String(q.id)];
    const isCorrect =
      userAns && userAns.toUpperCase() === q.correctOption.toUpperCase();
    if (filterMode === "correct" && !isCorrect) return false;
    if (filterMode === "incorrect" && isCorrect) return false;
    if (selectedPhase !== "All" && q.dmaicPhase !== selectedPhase) return false;
    return true;
  });

  // Estimate equivalent Sigma level for fun Six Sigma authenticity
  const sigmaEstimate =
    attempt.percentage >= 96
      ? "6.0σ (World Class)"
      : attempt.percentage >= 88
      ? "5.2σ (Excellence)"
      : attempt.percentage >= 80
      ? "4.6σ (High Capability)"
      : attempt.percentage >= 70
      ? "4.0σ (Green Belt Certified)"
      : "2.8σ (Process Needs Improvement)";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-slide-up">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#F97316]" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#4C1D95] hover:brightness-110 border border-purple-400/30 text-sm font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4 text-[#FBBF24]" />
            <span>Print Official Transcript</span>
          </button>
        </div>
      </div>

      {/* Official Certificate & Executive Score Hero Card */}
      <div className="mleaps-glass rounded-3xl p-6 sm:p-10 border border-white/15 relative overflow-hidden shadow-2xl">
        {/* Top Multi-Stop Mleaps Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#7C3AED]" />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F97316]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#7C3AED]/25 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left 7 Columns: Candidate & Certification Details */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <MleapsLogo size="md" variant="badge" />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24] block">
                  Official Evaluation Transcript
                </span>
                <h1
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-2xl sm:text-3xl font-extrabold text-white"
                >
                  Six Sigma Green Belt Certification Assessment
                </h1>
              </div>
            </div>

            {/* Pass / Fail Banner */}
            <div
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border ${
                attempt.passed
                  ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-300"
                  : "bg-rose-500/15 border-rose-400/50 text-rose-300"
              }`}
            >
              {attempt.passed ? (
                <AnimatedCheckIcon className="w-6 h-6" />
              ) : (
                <AnimatedCrossIcon className="w-6 h-6" />
              )}
              <div>
                <div className="text-sm font-extrabold uppercase tracking-wider">
                  {attempt.passed
                    ? "CERTIFIED PASS — GREEN BELT STANDARD MET (≥ 70%)"
                    : "BELOW PASSING THRESHOLD — REQUIRES ≥ 70% (18/25)"}
                </div>
                <div className="text-xs opacity-85">
                  Benchmark Equivalent: {sigmaEstimate}
                </div>
              </div>
            </div>

            {/* Candidate Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#070B16]/60 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <User className="w-5 h-5 text-[#F97316] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-purple-300/70 uppercase">
                    Candidate Name
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {attempt.candidateName}
                  </div>
                </div>
              </div>

              <div className="bg-[#070B16]/60 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#FBBF24] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-purple-300/70 uppercase">
                    Authorized Email
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {attempt.candidateEmail}
                  </div>
                </div>
              </div>

              <div className="bg-[#070B16]/60 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[11px] text-purple-300/70 uppercase">
                    Time Taken (Max 40m)
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-sm font-bold text-white"
                  >
                    {formatDuration(attempt.timeSpentSeconds)}
                  </div>
                </div>
              </div>

              <div className="bg-[#070B16]/60 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[11px] text-purple-300/70 uppercase">
                    Date Evaluated
                  </div>
                  <div className="text-sm font-bold text-white">
                    {new Date(attempt.submittedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Radial Score Gauge & Quick Breakdown */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#070B16]/75 rounded-3xl p-6 border border-white/10">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <defs>
                  <linearGradient
                    id="scoreGaugeGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  fill="none"
                  stroke="url(#scoreGaugeGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 66}
                  strokeDashoffset={
                    2 * Math.PI * 66 * (1 - attempt.percentage / 100)
                  }
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-4xl font-extrabold text-white"
                >
                  {attempt.percentage}%
                </span>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-sm font-bold text-[#FBBF24] mt-0.5"
                >
                  {attempt.score} / {attempt.totalQuestions}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-purple-300/80 mt-1">
                  Pass Mark: 70%
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5">
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-lg font-extrabold text-emerald-400"
                >
                  {attempt.score} Correct
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  Validated Answers
                </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-lg font-extrabold text-rose-400"
                >
                  {attempt.totalQuestions - attempt.score} Incorrect
                </div>
                <div className="text-[11px] text-rose-200/80">
                  Missed / Unanswered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DMAIC Phase Performance Breakdown */}
      <div className="mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#F97316]">
              Competency Diagnostics
            </span>
            <h2
              style={{ fontFamily: "var(--font-outfit)" }}
              className="text-xl font-bold text-white"
            >
              DMAIC Methodology Domain Breakdown
            </h2>
          </div>
          <Award className="w-6 h-6 text-[#FBBF24]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {phaseStats.map((st, idx) => (
            <div
              key={st.phase}
              style={{ animationDelay: `${idx * 80}ms` }}
              className="animate-slide-up bg-[#070B16]/70 rounded-2xl p-4 border border-white/10 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{st.phase}</span>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-xs font-bold text-[#FBBF24]"
                >
                  {st.correct}/{st.total}
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-gradient-to-r from-[#F97316] to-[#8B5CF6] rounded-full transition-all duration-700"
                  style={{ width: `${st.pct}%` }}
                />
              </div>
              <div className="text-right text-xs text-purple-200/80 font-mono">
                {st.pct}% Mastery
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Question-by-Question Answer Key & Explanations */}
      <div className="mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Official Answer Key &
              Explanations
            </span>
            <h2
              style={{ fontFamily: "var(--font-outfit)" }}
              className="text-xl font-bold text-white mt-0.5"
            >
              Question-by-Question Examiner Review ({filteredQuestions.length})
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: `All (${questions.length})` },
                { id: "correct", label: `Correct ✓ (${attempt.score})` },
                {
                  id: "incorrect",
                  label: `Incorrect ✕ (${
                    attempt.totalQuestions - attempt.score
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? "bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white shadow-md"
                    : "bg-white/5 text-purple-200 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#070B16] border border-white/15 text-purple-100 focus:outline-none focus:border-[#F97316]"
            >
              <option value="All">All DMAIC Phases</option>
              {phases.map((p) => (
                <option key={p} value={p}>
                  Phase: {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const chosen = attempt.answers?.[String(q.id)];
            const isCorrect =
              chosen && chosen.toUpperCase() === q.correctOption.toUpperCase();

            const opts: { letter: "A" | "B" | "C" | "D"; text: string }[] = [
              { letter: "A", text: q.optionA },
              { letter: "B", text: q.optionB },
              { letter: "C", text: q.optionC },
              { letter: "D", text: q.optionD },
            ];

            return (
              <div
                key={q.id}
                style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                className={`animate-slide-up rounded-2xl p-5 sm:p-6 border transition-all ${
                  isCorrect
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-rose-950/15 border-rose-500/35"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white font-bold text-xs"
                    >
                      Q{q.questionNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#7C3AED]/40 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                      {q.dmaicPhase}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Correct (+1 pt)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <XCircle className="w-4 h-4" />{" "}
                        {chosen
                          ? `Selected ${chosen} (Correct: ${q.correctOption})`
                          : `Unanswered (Correct: ${q.correctOption})`}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isCorrect ? (
                      <AnimatedCheckIcon className="w-7 h-7" />
                    ) : (
                      <AnimatedCrossIcon className="w-7 h-7" />
                    )}
                  </div>
                </div>

                <h3
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-base sm:text-lg font-bold text-white mb-4"
                >
                  {q.questionText}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {opts.map((o) => {
                    const isRightAnswer =
                      o.letter === q.correctOption.toUpperCase();
                    const isUserChoice =
                      chosen && o.letter === chosen.toUpperCase();

                    return (
                      <div
                        key={o.letter}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
                          isRightAnswer
                            ? "bg-emerald-500/20 border-emerald-400 text-white font-semibold"
                            : isUserChoice && !isRightAnswer
                            ? "bg-rose-500/20 border-rose-400 text-rose-100 font-semibold"
                            : "bg-[#070B16]/50 border-white/10 text-purple-200/75"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            style={{ fontFamily: "var(--font-mono)" }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isRightAnswer
                                ? "bg-emerald-500 text-slate-950"
                                : isUserChoice
                                ? "bg-rose-500 text-white"
                                : "bg-white/10 text-purple-200"
                            }`}
                          >
                            {o.letter}
                          </span>
                          <span>{o.text}</span>
                        </div>

                        {isRightAnswer && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 shrink-0">
                            Correct Key
                          </span>
                        )}
                        {isUserChoice && !isRightAnswer && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 shrink-0">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Official Examiner Explanation */}
                <div className="bg-[#070B16]/80 rounded-xl p-3.5 border border-[#F97316]/30 flex items-start gap-2.5 text-xs sm:text-sm text-purple-100">
                  <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#FBBF24]">
                      Examiner Explanation (Correct Answer: {q.correctOption}):{" "}
                    </strong>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
