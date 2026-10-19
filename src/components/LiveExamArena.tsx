"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Question, CandidateAssignment } from "@/db/schema";
import { MleapsLogo } from "./MleapsLogo";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Send,
  RotateCcw,
  ShieldCheck,
  Layers,
} from "lucide-react";

export type ExamTransitionMode =
  | "slide"
  | "cross-morph"
  | "cross-sweep"
  | "fade-scale";

interface LiveExamArenaProps {
  questions: Question[];
  assignment: CandidateAssignment;
  candidateName: string;
  candidateEmail: string;
  onSubmitExam: (payload: {
    answers: Record<string, string>;
    timeSpentSeconds: number;
    startedAt: string;
  }) => Promise<void>;
  onCancelExam: () => void;
}

export function LiveExamArena({
  questions,
  assignment,
  candidateName,
  candidateEmail,
  onSubmitExam,
  onCancelExam,
}: LiveExamArenaProps) {
  const durationSeconds = (assignment.durationMinutes || 40) * 60;
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [secondsLeft, setSecondsLeft] = useState<number>(durationSeconds);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [transitionMode, setTransitionMode] =
    useState<ExamTransitionMode>("slide");
  const [animKey, setAnimKey] = useState<number>(0);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleConfirmSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = Math.max(1, durationSeconds - secondsLeft);
    try {
      await onSubmitExam({
        answers,
        timeSpentSeconds: timeSpent,
        startedAt,
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [answers, durationSeconds, isSubmitting, onSubmitExam, secondsLeft, startedAt]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirmSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleConfirmSubmit]);

  const navigateToQuestion = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= questions.length) return;
      setSlideDirection(targetIdx >= currentIndex ? "next" : "prev");
      setCurrentIndex(targetIdx);
      setAnimKey((k) => k + 1);
    },
    [currentIndex, questions.length]
  );

  const handleSelectOption = useCallback(
    (optionLetter: "A" | "B" | "C" | "D") => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [String(currentQuestion.id)]: optionLetter,
      }));
    },
    [currentQuestion]
  );

  const toggleFlagCurrent = useCallback(() => {
    if (!currentQuestion) return;
    const qId = String(currentQuestion.id);
    setFlaggedIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  }, [currentQuestion]);

  // Keyboard shortcuts (A/B/C/D, Left/Right arrows, F to flag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;
      const key = e.key.toUpperCase();
      if (key === "A" || key === "B" || key === "C" || key === "D") {
        handleSelectOption(key as "A" | "B" | "C" | "D");
      } else if (e.key === "ArrowRight") {
        if (currentIndex < questions.length - 1) {
          navigateToQuestion(currentIndex + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          navigateToQuestion(currentIndex - 1);
        }
      } else if (key === "F") {
        toggleFlagCurrent();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentIndex,
    handleSelectOption,
    navigateToQuestion,
    questions.length,
    showSubmitModal,
    toggleFlagCurrent,
  ]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flaggedIds).filter(Boolean).length;
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  // Compute animation class based on selected transition mode + direction
  const getQuestionTransitionClass = () => {
    if (transitionMode === "slide") {
      return slideDirection === "next"
        ? "animate-slide-right"
        : "animate-slide-left";
    }
    if (transitionMode === "cross-morph") {
      return "animate-cross-morph";
    }
    if (transitionMode === "cross-sweep") {
      return "animate-cross-sweep";
    }
    return "animate-fade-scale";
  };

  const phaseColorBadge = (phase: string) => {
    switch (phase) {
      case "Define":
        return "from-[#F97316] to-[#FB923C] text-white";
      case "Measure":
        return "from-[#FB923C] to-[#FBBF24] text-slate-950";
      case "Analyze":
        return "from-[#9333EA] to-[#6B21A8] text-white";
      case "Improve":
        return "from-[#8B5CF6] to-[#4C1D95] text-white";
      case "Control":
        return "from-[#3B82F6] to-[#1D4ED8] text-white";
      default:
        return "from-[#F97316] to-[#7C3AED] text-white";
    }
  };

  if (!currentQuestion) {
    return null;
  }

  const selectedOptionForCurrent = answers[String(currentQuestion.id)];
  const isCurrentFlagged = !!flaggedIds[String(currentQuestion.id)];

  const optionsList: { letter: "A" | "B" | "C" | "D"; text: string }[] = [
    { letter: "A", text: currentQuestion.optionA },
    { letter: "B", text: currentQuestion.optionB },
    { letter: "C", text: currentQuestion.optionC },
    { letter: "D", text: currentQuestion.optionD },
  ];

  return (
    <div className="min-h-screen flex flex-col relative z-10 pb-12">
      {/* Top Proctored Exam Bar */}
      <header className="sticky top-0 z-30 mleaps-glass border-b border-white/10 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Candidate Identity */}
          <div className="flex items-center gap-4">
            <MleapsLogo size="sm" variant="badge" />
            <div className="hidden sm:block border-l border-white/15 pl-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Proctored Session
                </span>
                <span className="text-xs text-purple-200/80 font-medium">
                  Passing: 70% (18/25)
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {candidateName}{" "}
                <span className="text-xs font-normal text-purple-300/80">
                  ({candidateEmail})
                </span>
              </p>
            </div>
          </div>

          {/* Animation Transition Mode Switcher */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#070B16]/80 p-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-purple-300 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#F97316]" /> Motion:
            </span>
            {(
              [
                { id: "slide", label: "Kinetic Slide" },
                { id: "cross-morph", label: "Cross-Morph 3D" },
                { id: "cross-sweep", label: "Diagonal Cross" },
                { id: "fade-scale", label: "Fade Cascade" },
              ] as { id: ExamTransitionMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTransitionMode(m.id);
                  setAnimKey((k) => k + 1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  transitionMode === m.id
                    ? "bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white shadow-md"
                    : "text-purple-200/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Live Countdown Timer & Finish Button */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all ${
                secondsLeft < 180
                  ? "bg-rose-500/20 border-rose-500 text-rose-200 animate-pulse"
                  : secondsLeft < 600
                  ? "bg-amber-500/20 border-amber-400 text-amber-200"
                  : "bg-[#141A2D] border-[#7C3AED]/60 text-white"
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  secondsLeft < 180
                    ? "text-rose-400"
                    : secondsLeft < 600
                    ? "text-amber-400"
                    : "text-[#F97316]"
                }`}
              />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-purple-300/80 leading-none">
                  Time Remaining
                </div>
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-lg font-bold tracking-wider leading-tight"
                >
                  {formatTimer(secondsLeft)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#F97316] to-[#7C3AED] hover:brightness-110 shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>

        {/* Continuous Progress Bar */}
        <div className="max-w-7xl mx-auto mt-3">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#8B5CF6] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main 12-Column Exam Arena */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left 8 Columns: Animated Question Card & Options */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div
            key={`${currentQuestion.id}-${animKey}`}
            className={`${getQuestionTransitionClass()} mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden`}
          >
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#7C3AED]" />

            {/* Question Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F97316]/20 to-[#7C3AED]/30 border border-[#F97316]/40 text-[#FBBF24] font-bold text-sm"
                >
                  Question {String(currentIndex + 1).padStart(2, "0")} /{" "}
                  {String(questions.length).padStart(2, "0")}
                </span>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r ${phaseColorBadge(
                    currentQuestion.dmaicPhase
                  )} shadow-sm`}
                >
                  DMAIC: {currentQuestion.dmaicPhase}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedOptionForCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers((prev) => {
                        const copy = { ...prev };
                        delete copy[String(currentQuestion.id)];
                        return copy;
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-purple-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFlagCurrent}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCurrentFlagged
                      ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "bg-white/5 border-white/10 text-purple-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Flag
                    className={`w-3.5 h-3.5 ${
                      isCurrentFlagged ? "fill-amber-400 text-amber-400" : ""
                    }`}
                  />
                  {isCurrentFlagged ? "Flagged for Review" : "Flag Question"}
                </button>
              </div>
            </div>

            {/* Question Stem */}
            <h2
              style={{ fontFamily: "var(--font-outfit)" }}
              className="text-xl sm:text-2xl font-bold text-white leading-snug mb-8"
            >
              {currentQuestion.questionNumber}. {currentQuestion.questionText}
            </h2>

            {/* 4 Interactive Option Cards (A, B, C, D) */}
            <div className="space-y-3.5">
              {optionsList.map((opt, idx) => {
                const isSelected = selectedOptionForCurrent === opt.letter;
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => handleSelectOption(opt.letter)}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-slide-up w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-gradient-to-r from-[#F97316]/25 via-[#7C3AED]/35 to-[#4C1D95]/40 border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.28)] scale-[1.01]"
                        : "bg-[#070B16]/65 hover:bg-white/[0.07] border-white/10 hover:border-[#F97316]/50"
                    }`}
                  >
                    {/* Left sliding bar when selected */}
                    <div
                      className={`w-1.5 self-stretch rounded-full transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-b from-[#F97316] to-[#FBBF24]"
                          : "bg-transparent group-hover:bg-white/20"
                      }`}
                    />

                    <div className="flex items-center gap-4 flex-1">
                      <div
                        style={{ fontFamily: "var(--font-mono)" }}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-br from-[#F97316] to-[#FBBF24] text-slate-950 shadow-lg scale-105"
                            : "bg-white/10 text-purple-200 group-hover:bg-[#7C3AED]/50 group-hover:text-white"
                        }`}
                      >
                        {opt.letter}
                      </div>
                      <span
                        className={`text-base sm:text-lg font-medium leading-relaxed ${
                          isSelected
                            ? "text-white font-semibold"
                            : "text-purple-100/90 group-hover:text-white"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-md animate-fade-scale">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/20 group-hover:border-[#F97316]/60 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Navigation Controls */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => navigateToQuestion(currentIndex - 1)}
                className="px-5 py-3 rounded-2xl font-semibold text-sm bg-white/5 hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none border border-white/10 text-white flex items-center gap-2 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#F97316]" />
                <span>Previous Question</span>
              </button>

              <div className="text-xs text-purple-300/70 hidden sm:flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>Tip: Press keys A, B, C, D or ← / → arrows</span>
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => navigateToQuestion(currentIndex + 1)}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:brightness-110 shadow-[0_6px_20px_rgba(249,115,22,0.35)] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review & Submit Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: 25-Question Matrix Navigator & Status Legend */}
        <div className="lg:col-span-4 space-y-5">
          <div className="mleaps-glass rounded-3xl p-6 border border-white/15">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-base font-bold text-white"
                >
                  Assessment Question Matrix
                </h3>
                <p className="text-xs text-purple-300/75">
                  Click any question number to slide/cross-jump
                </p>
              </div>
              <span
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#7C3AED]/40 border border-[#7C3AED] text-purple-200"
              >
                {answeredCount}/{questions.length} Done
              </span>
            </div>

            {/* 5x5 Question Grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[String(q.id)];
                const isFlagged = !!flaggedIds[String(q.id)];

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => navigateToQuestion(idx)}
                    style={{ fontFamily: "var(--font-mono)" }}
                    className={`relative h-11 rounded-xl font-bold text-xs transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                      isCurrent
                        ? "bg-gradient-to-br from-[#F97316] to-[#FBBF24] text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.6)] scale-105 ring-2 ring-white"
                        : isAnswered
                        ? "bg-gradient-to-br from-[#8B5CF6] to-[#4C1D95] text-white border border-purple-400/50 hover:brightness-110"
                        : "bg-white/5 text-purple-200/80 border border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                    {answers[String(q.id)] && (
                      <span className="text-[9px] opacity-85 leading-none mt-0.5">
                        [{answers[String(q.id)]}]
                      </span>
                    )}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#070B16]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs text-purple-200/80 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-gradient-to-br from-[#F97316] to-[#FBBF24]" />
                <span>Current Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-gradient-to-br from-[#8B5CF6] to-[#4C1D95]" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white/10 border border-white/20" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                <span>Flagged ({flaggedCount})</span>
              </div>
            </div>
          </div>

          {/* Exam Instructions & Quick Submit Card */}
          <div className="mleaps-glass rounded-3xl p-5 border border-white/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
              Six Sigma Certification Rules
            </h4>
            <ul className="text-xs text-purple-200/80 space-y-2 leading-relaxed">
              <li>
                • Passing Threshold: <strong className="text-white">70% (18 / 25 correct)</strong>.
              </li>
              <li>
                • Single Best Answer: Each question has exactly one correct option (A, B, C, or D).
              </li>
              <li>
                • No negative marking for incorrect responses — attempt all 25 questions.
              </li>
            </ul>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#F97316] to-[#7C3AED] hover:brightness-110 shadow-lg transition-all cursor-pointer"
              >
                Finish & Grade Assessment ({answeredCount}/{questions.length})
              </button>
              <button
                type="button"
                onClick={onCancelExam}
                className="w-full py-2 rounded-xl text-xs font-medium text-purple-300/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Exit Without Submitting
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-scale">
          <div className="mleaps-glass max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-[#F97316]/40 shadow-[0_0_50px_rgba(249,115,22,0.25)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#7C3AED] flex items-center justify-center text-white shadow-lg">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-xl font-bold text-white"
                >
                  Submit Official Assessment?
                </h3>
                <p className="text-xs text-purple-200/80">
                  Mleaps Consulting • Six Sigma Green Belt Mock Examination
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="bg-white/5 rounded-2xl p-3.5 text-center border border-white/10">
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-2xl font-extrabold text-emerald-400"
                >
                  {answeredCount}
                </div>
                <div className="text-xs text-purple-200/80 mt-0.5">
                  Answered
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3.5 text-center border border-white/10">
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-2xl font-extrabold text-rose-400"
                >
                  {questions.length - answeredCount}
                </div>
                <div className="text-xs text-purple-200/80 mt-0.5">
                  Unanswered
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3.5 text-center border border-white/10">
                <div
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-2xl font-extrabold text-amber-400"
                >
                  {flaggedCount}
                </div>
                <div className="text-xs text-purple-200/80 mt-0.5">Flagged</div>
              </div>
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  You still have{" "}
                  <strong>{questions.length - answeredCount} unanswered</strong>{" "}
                  question(s). Unanswered questions are marked incorrect (0
                  points).
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Return to Questions
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:brightness-110 shadow-lg transition-all cursor-pointer"
              >
                {isSubmitting ? "Grading Exam..." : "Confirm & View Scorecard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
