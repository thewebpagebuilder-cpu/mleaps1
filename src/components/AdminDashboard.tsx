"use client";

import React, { useState } from "react";
import {
  Question,
  CandidateAssignment,
  ExamAttempt,
} from "@/db/schema";
import { ScorecardView } from "./ScorecardView";
import { AnimatedCheckIcon, AnimatedCrossIcon } from "./SixSigmaVisuals";
import {
  Users,
  BookOpen,
  BarChart3,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Award,
  Eye,
  X,
  Save,
  RotateCcw,
} from "lucide-react";

interface AdminDashboardProps {
  questions: Question[];
  assignments: CandidateAssignment[];
  attempts: ExamAttempt[];
  onRefreshData: () => Promise<void>;
  onTestCandidateEmail: (email: string, name: string) => void;
}

type AdminTab = "assignments" | "questions" | "scores";

export function AdminDashboard({
  questions,
  assignments,
  attempts,
  onRefreshData,
  onTestCandidateEmail,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("assignments");
  const [inspectingAttempt, setInspectingAttempt] =
    useState<ExamAttempt | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // --- TAB 1: CANDIDATE EMAIL & TIME PERIOD ASSIGNMENT STATE ---
  const toLocalDateTimeInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [newValidFrom, setNewValidFrom] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() - 5 * 60 * 1000))
  );
  const [newValidUntil, setNewValidUntil] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 48 * 3600 * 1000))
  );
  const [newDuration, setNewDuration] = useState(40);
  const [newNotes, setNewNotes] = useState("");
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const applyTimePreset = (
    preset: "now_48h" | "now_7d" | "express_1h" | "tomorrow_24h"
  ) => {
    const now = new Date();
    const hourMs = 3600 * 1000;
    if (preset === "now_48h") {
      setNewValidFrom(toLocalDateTimeInput(new Date(now.getTime() - 5 * 60000)));
      setNewValidUntil(
        toLocalDateTimeInput(new Date(now.getTime() + 48 * hourMs))
      );
    } else if (preset === "now_7d") {
      setNewValidFrom(toLocalDateTimeInput(new Date(now.getTime() - 5 * 60000)));
      setNewValidUntil(
        toLocalDateTimeInput(new Date(now.getTime() + 7 * 24 * hourMs))
      );
    } else if (preset === "express_1h") {
      setNewValidFrom(toLocalDateTimeInput(new Date(now.getTime() - 2 * 60000)));
      setNewValidUntil(
        toLocalDateTimeInput(new Date(now.getTime() + 1 * hourMs))
      );
    } else if (preset === "tomorrow_24h") {
      setNewValidFrom(
        toLocalDateTimeInput(new Date(now.getTime() + 24 * hourMs))
      );
      setNewValidUntil(
        toLocalDateTimeInput(new Date(now.getTime() + 48 * hourMs))
      );
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim() || !newCandidateEmail.trim()) {
      showToast("Please provide both Candidate Name and Email.", "error");
      return;
    }
    setIsCreatingAssignment(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: newCandidateName.trim(),
          candidateEmail: newCandidateEmail.trim().toLowerCase(),
          validFrom: new Date(newValidFrom).toISOString(),
          validUntil: new Date(newValidUntil).toISOString(),
          durationMinutes: newDuration,
          notes: newNotes.trim() || "Authorized by Administrator",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to assign candidate", "error");
      } else {
        showToast(
          `Assigned ${data.assignment.candidateEmail} for selected time window!`
        );
        setNewCandidateName("");
        setNewCandidateEmail("");
        setNewNotes("");
        await onRefreshData();
      }
    } catch {
      showToast("Network error while creating assignment.", "error");
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleQuickAssignmentAction = async (
    id: number,
    quickAction: "activate_now_48h" | "extend_24h" | "reset_retake"
  ) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickAction }),
      });
      if (res.ok) {
        showToast("Updated candidate time window & authorization status!");
        await onRefreshData();
      } else {
        showToast("Failed to update assignment.", "error");
      }
    } catch {
      showToast("Error updating assignment.", "error");
    }
  };

  const handleDeleteAssignment = async (id: number, email: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Revoked exam access for ${email}.`);
        await onRefreshData();
      }
    } catch {
      showToast("Failed to revoke assignment.", "error");
    }
  };

  // --- TAB 2: QUESTION & ANSWER KEY CRUD STATE ---
  const [questionSearch, setQuestionSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [editingQuestion, setEditingQuestion] =
    useState<Partial<Question> | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const openNewQuestionModal = () => {
    setEditingQuestion({
      questionNumber: questions.length + 1,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      explanation: "",
      dmaicPhase: "Define",
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (
      !editingQuestion.questionText?.trim() ||
      !editingQuestion.optionA?.trim() ||
      !editingQuestion.optionB?.trim() ||
      !editingQuestion.optionC?.trim() ||
      !editingQuestion.optionD?.trim()
    ) {
      showToast("Please fill in the question stem and all 4 options.", "error");
      return;
    }

    setIsSavingQuestion(true);
    try {
      const isEdit = !!editingQuestion.id;
      const url = isEdit
        ? `/api/questions/${editingQuestion.id}`
        : "/api/questions";
      const method = isEdit ? "PUT" : "POST";

      const safeNumber =
        Number.isFinite(editingQuestion.questionNumber) &&
        (editingQuestion.questionNumber as number) > 0
          ? editingQuestion.questionNumber
          : questions.length + 1;

      const payload = {
        questionNumber: safeNumber,
        questionText: (editingQuestion.questionText || "").trim(),
        optionA: (editingQuestion.optionA || "").trim(),
        optionB: (editingQuestion.optionB || "").trim(),
        optionC: (editingQuestion.optionC || "").trim(),
        optionD: (editingQuestion.optionD || "").trim(),
        correctOption: (editingQuestion.correctOption || "A")
          .toUpperCase()
          .slice(0, 1),
        explanation: (editingQuestion.explanation || "").trim(),
        dmaicPhase: editingQuestion.dmaicPhase || "Define",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(
          isEdit
            ? `Updated Question #${editingQuestion.questionNumber} & Answer Key!`
            : `Created new Question #${editingQuestion.questionNumber}!`
        );
        setEditingQuestion(null);
        await onRefreshData();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save question", "error");
      }
    } catch {
      showToast("Error saving question.", "error");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (q: Question) => {
    try {
      const res = await fetch(`/api/questions/${q.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Deleted Question #${q.questionNumber}.`);
        await onRefreshData();
      }
    } catch {
      showToast("Failed to delete question.", "error");
    }
  };

  const handleRestoreDefaultQuestions = async () => {
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
      });
      if (res.ok) {
        showToast("Restored official 25 Six Sigma Green Belt questions!");
        await onRefreshData();
      }
    } catch {
      showToast("Failed to restore default questions.", "error");
    }
  };

  // --- TAB 3: SCORES & ATTEMPTS FILTER STATE ---
  const [scoreSearch, setScoreSearch] = useState("");

  // If inspecting a specific candidate's full scorecard
  if (inspectingAttempt) {
    return (
      <ScorecardView
        attempt={inspectingAttempt}
        questions={questions}
        onBack={() => setInspectingAttempt(null)}
        backLabel="Back to Admin Command Center"
      />
    );
  }

  // Compute KPI metrics
  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const passRate =
    totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const avgPercentage =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts
        )
      : 0;

  const now = new Date();
  const activeAssignmentsCount = assignments.filter((a) => {
    const f = new Date(a.validFrom);
    const u = new Date(a.validUntil);
    return a.status !== "completed" && now >= f && now <= u;
  }).length;

  const filteredQuestions = questions.filter((q) => {
    if (phaseFilter !== "All" && q.dmaicPhase !== phaseFilter) return false;
    if (!questionSearch.trim()) return true;
    const s = questionSearch.toLowerCase();
    return (
      q.questionText.toLowerCase().includes(s) ||
      q.optionA.toLowerCase().includes(s) ||
      q.optionB.toLowerCase().includes(s) ||
      q.optionC.toLowerCase().includes(s) ||
      q.optionD.toLowerCase().includes(s) ||
      q.explanation.toLowerCase().includes(s)
    );
  });

  const filteredAttempts = attempts.filter((a) => {
    if (!scoreSearch.trim()) return true;
    const s = scoreSearch.toLowerCase();
    return (
      a.candidateName.toLowerCase().includes(s) ||
      a.candidateEmail.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-slide-up">
      {/* Floating Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 animate-slide-up ${
            toast.type === "success"
              ? "bg-[#141A2D]/95 border-emerald-400 text-emerald-200"
              : "bg-[#141A2D]/95 border-rose-400 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <AnimatedCheckIcon className="w-5 h-5" />
          ) : (
            <AnimatedCrossIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Executive Admin Header & KPI Strip */}
      <div className="mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#7C3AED]" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FBBF24] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#F97316]" /> Examiner &
              Administrator Control Center
            </span>
            <h1
              style={{ fontFamily: "var(--font-outfit)" }}
              className="text-2xl sm:text-3xl font-extrabold text-white mt-1"
            >
              Mleaps Consulting — Assessment Management Suite
            </h1>
          </div>

          <button
            type="button"
            onClick={onRefreshData}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-purple-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Sync Live Database</span>
          </button>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#070B16]/70 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300/80">
                Active Question Bank
              </div>
              <div
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-2xl font-extrabold text-white mt-1"
              >
                {questions.length} MCQs
              </div>
              <div className="text-[11px] text-[#FBBF24] mt-0.5">
                40 Min • 70% Pass Key
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97316]/20 to-[#F97316]/5 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#070B16]/70 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300/80">
                Assigned Candidates
              </div>
              <div
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-2xl font-extrabold text-white mt-1"
              >
                {assignments.length} Total
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                {activeAssignmentsCount} Active Windows Now
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED]/30 to-[#7C3AED]/10 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#070B16]/70 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300/80">
                Completed Exam Attempts
              </div>
              <div
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-2xl font-extrabold text-white mt-1"
              >
                {totalAttempts} Graded
              </div>
              <div className="text-[11px] text-purple-300 mt-0.5">
                {passedCount} Certified Green Belt
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#070B16]/70 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300/80">
                Cohort Mean & Pass Rate
              </div>
              <div
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-2xl font-extrabold text-[#FBBF24] mt-1"
              >
                {avgPercentage}% Avg
              </div>
              <div className="text-[11px] text-emerald-300 mt-0.5">
                {passRate}% Pass Rate (≥18/25)
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/40 flex items-center justify-center text-[#FBBF24]">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3-Tab Sliding Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-7 pt-6 border-t border-white/10">
          {(
            [
              {
                id: "assignments",
                label: "1. Assign Candidate Email & Time Window",
                icon: Users,
                badge: assignments.length,
              },
              {
                id: "questions",
                label: "2. Manage Questions & Answer Key",
                icon: BookOpen,
                badge: questions.length,
              },
              {
                id: "scores",
                label: "3. Candidate Scores & Answer Sheets",
                icon: BarChart3,
                badge: attempts.length,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white shadow-[0_8px_25px_rgba(249,115,22,0.35)] scale-[1.02]"
                    : "bg-white/5 hover:bg-white/10 text-purple-200 border border-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? "bg-black/30 text-[#FBBF24]"
                      : "bg-white/10 text-purple-200"
                  }`}
                >
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: ASSIGN CANDIDATE EMAIL & TIME PERIOD
      ===================================================================== */}
      {activeTab === "assignments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-cross-morph">
          {/* Left 5 Columns: Create New Email + Time Window Assignment */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleCreateAssignment}
              className="mleaps-glass rounded-3xl p-6 sm:p-7 border border-[#F97316]/40 space-y-5 sticky top-24"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F97316]">
                  Time-Gated Email Authorization
                </span>
                <h2
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-xl font-bold text-white mt-0.5"
                >
                  Assign Candidate to Exam Window
                </h2>
                <p className="text-xs text-purple-200/75 mt-1">
                  Only the assigned email will be permitted to launch the
                  assessment, and strictly within the selected start and end
                  date/time window.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  placeholder="e.g., Rohan Deshmukh"
                  className="w-full px-4 py-3 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                  Authorized Candidate Email *
                </label>
                <input
                  type="email"
                  required
                  value={newCandidateEmail}
                  onChange={(e) => setNewCandidateEmail(e.target.value)}
                  placeholder="e.g., rohan.deshmukh@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              {/* Quick Time Window Presets */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FBBF24] mb-2">
                  Quick Time-Period Presets:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyTimePreset("now_48h")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F97316]/20 border border-white/10 hover:border-[#F97316]/50 text-xs font-semibold text-purple-100 transition-all cursor-pointer text-left"
                  >
                    ⚡ Active Now (48 Hours)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTimePreset("now_7d")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F97316]/20 border border-white/10 hover:border-[#F97316]/50 text-xs font-semibold text-purple-100 transition-all cursor-pointer text-left"
                  >
                    📅 Active Now (7 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTimePreset("express_1h")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F97316]/20 border border-white/10 hover:border-[#F97316]/50 text-xs font-semibold text-purple-100 transition-all cursor-pointer text-left"
                  >
                    ⏱️ 1-Hour Express Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTimePreset("tomorrow_24h")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F97316]/20 border border-white/10 hover:border-[#F97316]/50 text-xs font-semibold text-purple-100 transition-all cursor-pointer text-left"
                  >
                    🔒 Schedule Tomorrow
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                    Window Opens (Valid From) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newValidFrom}
                    onChange={(e) => setNewValidFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                    Window Closes (Valid Until) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newValidUntil}
                    onChange={(e) => setNewValidUntil(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                    Cohort / Batch Note
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Green Belt Batch A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B16]/90 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingAssignment}
                className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:brightness-110 shadow-[0_8px_25px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isCreatingAssignment
                    ? "Assigning Candidate..."
                    : "Authorize Email & Schedule Window"}
                </span>
              </button>
            </form>
          </div>

          {/* Right 7 Columns: List of Assigned Candidates & Window Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="mleaps-glass rounded-3xl p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3
                    style={{ fontFamily: "var(--font-outfit)" }}
                    className="text-lg font-bold text-white"
                  >
                    Authorized Candidate Roster ({assignments.length})
                  </h3>
                  <p className="text-xs text-purple-200/75">
                    Manage active windows, extend deadlines, or click{" "}
                    <strong className="text-[#FBBF24]">
                      Test in Portal ↗
                    </strong>{" "}
                    to simulate logging in with that email.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {assignments.map((a, idx) => {
                  const from = new Date(a.validFrom);
                  const until = new Date(a.validUntil);
                  const isCompleted = a.status === "completed";
                  const isUpcoming = !isCompleted && now < from;
                  const isExpired = !isCompleted && now > until;
                  const isActive = !isCompleted && now >= from && now <= until;

                  const matchingAttempt = attempts.find(
                    (att) =>
                      att.assignmentId === a.id ||
                      att.candidateEmail.toLowerCase() ===
                        a.candidateEmail.toLowerCase()
                  );

                  return (
                    <div
                      key={a.id}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      className="animate-slide-up bg-[#070B16]/75 rounded-2xl p-5 border border-white/10 hover:border-[#F97316]/40 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base font-bold text-white">
                              {a.candidateName}
                            </h4>
                            {isActive && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                ● ACTIVE WINDOW OPEN
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                                ⏳ SCHEDULED (FUTURE)
                              </span>
                            )}
                            {isExpired && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/40">
                                ✕ WINDOW EXPIRED
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                                ✓ COMPLETED{" "}
                                {matchingAttempt
                                  ? `(${matchingAttempt.score}/${matchingAttempt.totalQuestions} • ${matchingAttempt.percentage}%)`
                                  : ""}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#FBBF24] font-mono mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{a.candidateEmail}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onTestCandidateEmail(
                                a.candidateEmail,
                                a.candidateName
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-sm"
                          >
                            <span>Test in Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAssignment(a.id, a.candidateEmail)
                            }
                            title="Revoke Access"
                            className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Time Period Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/[0.03] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 text-purple-200">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>From:</strong> {from.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-200">
                          <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>
                            <strong>Until:</strong> {until.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Admin Quick Window Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-purple-300/70">
                          {a.notes || `Duration: ${a.durationMinutes} mins`}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {(isExpired || isUpcoming) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAssignmentAction(
                                  a.id,
                                  "activate_now_48h"
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                            >
                              ⚡ Activate Now (48h)
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAssignmentAction(a.id, "extend_24h")
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
                          >
                            +24h Window
                          </button>

                          {isCompleted && (
                            <>
                              {matchingAttempt && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectingAttempt(matchingAttempt)
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/40 hover:bg-[#7C3AED]/60 border border-purple-400/40 text-purple-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View Score
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAssignmentAction(
                                    a.id,
                                    "reset_retake"
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Allow Retake
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MANAGE QUESTIONS & ANSWERS (FULL CRUD + QUICK KEY)
      ===================================================================== */}
      {activeTab === "questions" && (
        <div className="space-y-6 animate-cross-morph">
          {/* Quick Reference Answer Key Strip (Matches Examiner Document) */}
          <div className="mleaps-glass rounded-3xl p-6 border border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">
                  Examiner Quick Reference — Correct Options
                </span>
                <h3
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-lg font-bold text-white"
                >
                  Live Master Answer Key (Click any cell to edit question &
                  answer)
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestoreDefaultQuestions}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Restore Default 25 Questions</span>
                </button>

                <button
                  type="button"
                  onClick={openNewQuestionModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Question</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
              {questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setEditingQuestion(q)}
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="p-2 rounded-xl bg-[#070B16]/80 hover:bg-[#F97316]/25 border border-white/10 hover:border-[#F97316] text-center transition-all cursor-pointer group"
                >
                  <div className="text-[10px] text-purple-300/70 group-hover:text-white">
                    Q{q.questionNumber}
                  </div>
                  <div className="text-sm font-extrabold text-[#FBBF24] group-hover:scale-110 transition-transform">
                    {q.correctOption}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search & DMAIC Phase Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-purple-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search questions, options, or Six Sigma concepts (e.g., DPMO, Cpk, FMEA, Poka-Yoke)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141A2D]/90 border border-white/15 text-sm text-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["All", "Define", "Measure", "Analyze", "Improve", "Control"].map(
                (phase) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setPhaseFilter(phase)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      phaseFilter === phase
                        ? "bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white shadow-md"
                        : "bg-white/5 text-purple-200 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {phase}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="mleaps-glass rounded-3xl p-6 border border-white/15 hover:border-[#F97316]/40 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-slate-950 font-extrabold text-xs"
                    >
                      Question #{q.questionNumber}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#7C3AED]/40 border border-purple-400/30 text-purple-200 font-bold text-xs">
                      DMAIC Phase: {q.dmaicPhase}
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs"
                    >
                      Correct Answer: Option {q.correctOption}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#F97316] hover:text-slate-950 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Question & Answer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q)}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-lg font-bold text-white mb-4"
                >
                  {q.questionText}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {(
                    [
                      { letter: "A", text: q.optionA },
                      { letter: "B", text: q.optionB },
                      { letter: "C", text: q.optionC },
                      { letter: "D", text: q.optionD },
                    ] as const
                  ).map((opt) => {
                    const isCorrect =
                      q.correctOption.toUpperCase() === opt.letter;
                    return (
                      <div
                        key={opt.letter}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
                          isCorrect
                            ? "bg-emerald-500/20 border-emerald-400 text-white font-semibold"
                            : "bg-[#070B16]/60 border-white/10 text-purple-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            style={{ fontFamily: "var(--font-mono)" }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCorrect
                                ? "bg-emerald-400 text-slate-950"
                                : "bg-white/10 text-purple-200"
                            }`}
                          >
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-purple-200/85 bg-[#070B16]/70 rounded-xl p-3 border border-white/10">
                  <strong className="text-[#FBBF24]">Explanation: </strong>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: CANDIDATE SCORES & DETAILED ATTEMPT ANALYTICS
      ===================================================================== */}
      {activeTab === "scores" && (
        <div className="space-y-6 animate-cross-morph">
          <div className="mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">
                  Candidate Evaluation Ledger
                </span>
                <h2
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-xl font-bold text-white"
                >
                  Attempted Candidate Scores & Answer Sheet Verification
                </h2>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scoreSearch}
                  onChange={(e) => setScoreSearch(e.target.value)}
                  placeholder="Filter by candidate name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070B16]/90 border border-white/15 text-xs text-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="text-center py-12 text-purple-300/70">
                No candidate attempts match your search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-purple-300/80">
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Authorized Email</th>
                      <th className="py-3.5 px-4">Raw Score</th>
                      <th className="py-3.5 px-4">Percentage</th>
                      <th className="py-3.5 px-4">Result (Pass ≥ 70%)</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {filteredAttempts.map((att) => (
                      <tr
                        key={att.id}
                        className="hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-white">
                          {att.candidateName}
                        </td>
                        <td
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="py-4 px-4 text-xs text-[#FBBF24]"
                        >
                          {att.candidateEmail}
                        </td>
                        <td
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="py-4 px-4 font-extrabold text-white"
                        >
                          {att.score} / {att.totalQuestions}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ fontFamily: "var(--font-mono)" }}
                              className="font-bold text-white"
                            >
                              {att.percentage}%
                            </span>
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  att.passed
                                    ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                    : "bg-gradient-to-r from-rose-500 to-amber-500"
                                }`}
                                style={{ width: `${att.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {att.passed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                              <CheckCircle2 className="w-3.5 h-3.5" /> CERTIFIED
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/40">
                              <AlertCircle className="w-3.5 h-3.5" /> BELOW 70%
                            </span>
                          )}
                        </td>
                        <td
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="py-4 px-4 text-xs text-purple-200"
                        >
                          {Math.floor(att.timeSpentSeconds / 60)}m{" "}
                          {att.timeSpentSeconds % 60}s
                        </td>
                        <td className="py-4 px-4 text-xs text-purple-200/80">
                          {new Date(att.submittedAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingAttempt(att)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#7C3AED] text-white font-bold text-xs inline-flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Scorecard</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CREATE OR EDIT QUESTION & ANSWER KEY
      ===================================================================== */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-scale">
          <form
            onSubmit={handleSaveQuestion}
            className="mleaps-glass max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-[#F97316]/50 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">
                  Six Sigma Question & Answer Editor
                </span>
                <h3
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-xl font-bold text-white"
                >
                  {editingQuestion.id
                    ? `Edit Question #${editingQuestion.questionNumber}`
                    : "Create New Assessment Question"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  Question #
                </label>
                <input
                  type="number"
                  required
                  value={editingQuestion.questionNumber ?? 1}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      questionNumber: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B16] border border-white/15 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  DMAIC Phase
                </label>
                <select
                  value={editingQuestion.dmaicPhase || "Define"}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      dmaicPhase: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B16] border border-white/15 text-white text-sm"
                >
                  {["Define", "Measure", "Analyze", "Improve", "Control"].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">
                  Correct Answer Key
                </label>
                <select
                  value={editingQuestion.correctOption || "A"}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctOption: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-400/50 text-emerald-300 font-bold text-sm"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                Question Stem *
              </label>
              <textarea
                rows={3}
                required
                value={editingQuestion.questionText || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    questionText: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B16] border border-white/15 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const fieldKey = `option${letter}` as
                  | "optionA"
                  | "optionB"
                  | "optionC"
                  | "optionD";
                const isCorrect = editingQuestion.correctOption === letter;
                return (
                  <div key={letter}>
                    <label className="flex items-center justify-between text-xs font-bold uppercase text-purple-200 mb-1">
                      <span>Option {letter} *</span>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-400">
                          ★ Correct Answer
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingQuestion[fieldKey] || ""}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          [fieldKey]: e.target.value,
                        })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070B16] border text-sm text-white ${
                        isCorrect ? "border-emerald-400" : "border-white/15"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                Detailed Examiner Explanation
              </label>
              <textarea
                rows={2}
                value={editingQuestion.explanation || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    explanation: e.target.value,
                  })
                }
                placeholder="Explain why the selected option is correct..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B16] border border-white/15 text-white text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSavingQuestion
                    ? "Saving Changes..."
                    : "Save Question & Answer Key"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
