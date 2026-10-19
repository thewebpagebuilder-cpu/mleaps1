"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Question,
  CandidateAssignment,
  ExamAttempt,
} from "@/db/schema";
import { MleapsLogo } from "@/components/MleapsLogo";
import {
  SixSigmaBellCurveCard,
  AnimatedCheckIcon,
  AnimatedCrossIcon,
} from "@/components/SixSigmaVisuals";
import { LiveExamArena } from "@/components/LiveExamArena";
import { ScorecardView } from "@/components/ScorecardView";
import { AdminDashboard } from "@/components/AdminDashboard";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Award,
  Settings,
  GraduationCap,
  Play,
  AlertTriangle,
  Eye,
} from "lucide-react";

type WorkspaceMode = "candidate" | "admin";
type CandidateStage = "verify" | "briefing" | "exam" | "scorecard";

interface VerificationResult {
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
}

export default function SixSigmaAssessmentPlatform() {
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceMode>("candidate");
  const [candidateStage, setCandidateStage] =
    useState<CandidateStage>("verify");

  // Database state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Candidate verification inputs
  const [emailInput, setEmailInput] = useState<string>(
    "alex.rivera@mleaps.com"
  );
  const [nameInput, setNameInput] = useState<string>("Alex Rivera");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [activeAssignment, setActiveAssignment] =
    useState<CandidateAssignment | null>(null);
  const [completedAttempt, setCompletedAttempt] =
    useState<ExamAttempt | null>(null);
  const [shakeError, setShakeError] = useState<boolean>(false);

  const fetchAllPlatformData = useCallback(async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        fetch("/api/questions"),
        fetch("/api/assignments"),
      ]);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssignments(aData.assignments || []);
        setAttempts(aData.attempts || []);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPlatformData();
  }, [fetchAllPlatformData]);

  const handleVerifyCandidate = async (
    e?: React.FormEvent,
    overrideEmail?: string,
    overrideName?: string
  ) => {
    if (e) e.preventDefault();
    const targetEmail = (overrideEmail ?? emailInput).trim().toLowerCase();
    const targetName = (overrideName ?? nameInput).trim();

    if (!targetEmail) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch("/api/assignments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          candidateName: targetName,
        }),
      });
      const data: VerificationResult = await res.json();
      setVerificationResult(data);

      if (data.allowed && data.assignment) {
        setActiveAssignment(data.assignment);
        if (!targetName && data.assignment.candidateName) {
          setNameInput(data.assignment.candidateName);
        }
      } else {
        setShakeError(true);
        setTimeout(() => setShakeError(false), 650);
      }
    } catch {
      setVerificationResult({
        allowed: false,
        code: "SERVER_ERROR",
        message: "Unable to verify email authorization. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitExamAttempt = async (payload: {
    answers: Record<string, string>;
    timeSpentSeconds: number;
    startedAt: string;
  }) => {
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: activeAssignment?.id ?? null,
        candidateName:
          nameInput.trim() ||
          activeAssignment?.candidateName ||
          "Authorized Candidate",
        candidateEmail:
          emailInput.trim().toLowerCase() ||
          activeAssignment?.candidateEmail ||
          "",
        answers: payload.answers,
        timeSpentSeconds: payload.timeSpentSeconds,
        startedAt: payload.startedAt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCompletedAttempt(data.attempt);
      if (data.questions) {
        setQuestions(data.questions);
      }
      setCandidateStage("scorecard");
      await fetchAllPlatformData();
    }
  };

  const handleTestCandidateFromAdmin = (email: string, name: string) => {
    setEmailInput(email);
    setNameInput(name);
    setWorkspaceMode("candidate");
    setCandidateStage("verify");
    handleVerifyCandidate(undefined, email, name);
  };

  // If the candidate is currently inside the proctored Live Exam Arena, show full-screen Arena
  if (
    workspaceMode === "candidate" &&
    candidateStage === "exam" &&
    activeAssignment
  ) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-white relative overflow-hidden">
        <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-[#F97316]/8 blur-[150px] pointer-events-none animate-aurora" />
        <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#7C3AED]/12 blur-[150px] pointer-events-none animate-aurora-delayed" />

        <LiveExamArena
          questions={questions}
          assignment={activeAssignment}
          candidateName={nameInput || activeAssignment.candidateName}
          candidateEmail={emailInput || activeAssignment.candidateEmail}
          onSubmitExam={handleSubmitExamAttempt}
          onCancelExam={() => setCandidateStage("briefing")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-white relative overflow-hidden flex flex-col">
      {/* Ambient Floating Mleaps Orange & Royal Purple Aurora Orbs */}
      <div className="fixed -top-36 -left-36 w-[460px] h-[460px] rounded-full bg-[#F97316]/8 blur-[150px] pointer-events-none animate-aurora" />
      <div className="fixed top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-[#7C3AED]/12 blur-[160px] pointer-events-none animate-aurora-delayed" />
      <div className="fixed -bottom-40 left-1/4 w-[420px] h-[420px] rounded-full bg-[#FBBF24]/6 blur-[150px] pointer-events-none animate-aurora" />

      {/* Top Glassmorphic Brand Navigation Bar */}
      <header className="sticky top-0 z-40 mleaps-glass border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Mleaps Consulting Logo & Assessment Title */}
          <div
            onClick={() => {
              setWorkspaceMode("candidate");
              setCandidateStage("verify");
            }}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <MleapsLogo size="sm" variant="badge" />
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FBBF24]">
                  Mleaps Consulting Certification Portal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/40 border border-purple-400/40 text-purple-200">
                  6σ Green Belt
                </span>
              </div>
              <h1
                style={{ fontFamily: "var(--font-outfit)" }}
                className="text-lg font-extrabold text-white group-hover:text-[#FBBF24] transition-colors"
              >
                Six Sigma Green Belt Certification Assessment
              </h1>
            </div>
          </div>

          {/* Mode Switcher: Candidate Portal vs. Admin Command Center */}
          <div className="flex items-center gap-2 bg-[#070B16]/90 p-1.5 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => setWorkspaceMode("candidate")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                workspaceMode === "candidate"
                  ? "bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-slate-950 shadow-[0_4px_20px_rgba(249,115,22,0.4)]"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Candidate Exam Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceMode("admin")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                workspaceMode === "admin"
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-[0_4px_20px_rgba(124,58,237,0.5)]"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Admin Command Center</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {workspaceMode === "admin" ? (
          <AdminDashboard
            questions={questions}
            assignments={assignments}
            attempts={attempts}
            onRefreshData={fetchAllPlatformData}
            onTestCandidateEmail={handleTestCandidateFromAdmin}
          />
        ) : candidateStage === "scorecard" && completedAttempt ? (
          <ScorecardView
            attempt={completedAttempt}
            questions={questions}
            onBack={() => {
              setCandidateStage("verify");
              setVerificationResult(null);
            }}
            backLabel="Return to Candidate Verification Portal"
          />
        ) : candidateStage === "briefing" && activeAssignment ? (
          /* =================================================================
             STAGE 2: OFFICIAL PRE-EXAM BRIEFING & COVER SHEET
             Matches the exact header & instructions from the user's prompt!
          ================================================================= */
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-cross-morph">
            <div className="mleaps-glass rounded-3xl p-6 sm:p-10 border border-[#F97316]/50 shadow-[0_20px_60px_rgba(0,0,0,0.75)] relative overflow-hidden">
              {/* Top Gradient Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#7C3AED]" />

              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/15">
                <MleapsLogo size="md" variant="badge" />
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <ShieldCheck className="w-4 h-4" /> Identity & Time Window
                    Verified
                  </span>
                  <div className="text-xs text-purple-200/80 mt-1 font-mono">
                    Authorized Window Ends:{" "}
                    {new Date(activeAssignment.validUntil).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Official Cover Sheet Title */}
              <div className="my-6 text-center sm:text-left">
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#FBBF24]">
                  Mock Examination — Practice & Certification Assessment
                </div>
                <h2
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-2xl sm:text-4xl font-extrabold text-white mt-1"
                >
                  Six Sigma Green Belt Certification Assessment
                </h2>
                <p className="text-sm text-purple-200/85 mt-1">
                  {questions.length} Multiple Choice Questions — Practice
                  Assessment
                </p>
              </div>

              {/* Official Exam Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
                <div className="bg-[#070B16]/80 rounded-2xl p-4 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-purple-300/75">
                    Total Questions
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-2xl font-extrabold text-white mt-1"
                  >
                    {questions.length} MCQs
                  </div>
                </div>

                <div className="bg-[#070B16]/80 rounded-2xl p-4 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-purple-300/75">
                    Duration
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-2xl font-extrabold text-[#FBBF24] mt-1"
                  >
                    {activeAssignment.durationMinutes} mins
                  </div>
                </div>

                <div className="bg-[#070B16]/80 rounded-2xl p-4 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-purple-300/75">
                    Question Type
                  </div>
                  <div className="text-sm font-extrabold text-white mt-1.5">
                    Single Best (A/B/C/D)
                  </div>
                </div>

                <div className="bg-[#070B16]/80 rounded-2xl p-4 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-purple-300/75">
                    Passing Score
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-2xl font-extrabold text-emerald-400 mt-1"
                  >
                    70% (18/25)
                  </div>
                </div>
              </div>

              {/* Candidate Name & Date Fields (Matching Document Header) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.03] rounded-2xl p-5 border border-white/10 my-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#FBBF24] mb-1">
                    Candidate Name:
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#070B16] border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#FBBF24] mb-1">
                    Assigned Email & Date:
                  </label>
                  <div className="px-3.5 py-2 rounded-xl bg-[#070B16]/60 border border-white/10 text-purple-100 text-sm font-mono flex items-center justify-between">
                    <span className="truncate">{emailInput}</span>
                    <span className="text-xs text-purple-300 shrink-0 ml-2">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Instructions Box */}
              <div className="bg-[#070B16]/90 rounded-2xl p-5 border border-[#7C3AED]/60 space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#F97316]">
                  <FileText className="w-4 h-4" /> Official Examination
                  Instructions
                </div>
                <p className="text-sm text-purple-100/90 leading-relaxed">
                  Read each question carefully and select the single best answer{" "}
                  <strong className="text-white">(A, B, C, or D)</strong>. Mark
                  your chosen option clearly. There is only one correct answer
                  per question. Do not refer to notes or external material
                  unless the assessment is explicitly open-book. Detailed
                  answers and explanations are provided on your official
                  scorecard immediately upon submission.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCandidateStage("verify")}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-semibold text-purple-200 cursor-pointer"
                >
                  ← Change Candidate Email
                </button>

                <button
                  type="button"
                  onClick={() => setCandidateStage("exam")}
                  className="px-8 py-4 rounded-2xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:brightness-110 shadow-[0_10px_35px_rgba(249,115,22,0.45)] flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer animate-pulse-orange"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Begin 40-Minute Assessment Now</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             STAGE 1: CANDIDATE EMAIL & TIME-WINDOW VERIFICATION LANDING
          ================================================================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left 7 Columns: Brand Showcase, Exam Specs & 6σ Bell Curve */}
              <div className="lg:col-span-7 space-y-6 animate-slide-left">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F97316]/20 to-[#7C3AED]/30 border border-[#F97316]/40 text-xs font-bold text-[#FBBF24]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>
                    Mleaps Consulting • Accredited Six Sigma Evaluation
                  </span>
                </div>

                <h1
                  style={{ fontFamily: "var(--font-outfit)" }}
                  className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-white"
                >
                  Six Sigma{" "}
                  <span className="text-mleaps-gradient">
                    Green Belt Certification
                  </span>{" "}
                  Assessment
                </h1>

                <p className="text-base sm:text-lg text-purple-200/85 leading-relaxed max-w-2xl">
                  Welcome to the official{" "}
                  <strong className="text-white">Mleaps Consulting</strong>{" "}
                  Mock Examination & Certification Platform. Validate your
                  mastery across the{" "}
                  <strong className="text-[#FBBF24]">
                    Define, Measure, Analyze, Improve, and Control (DMAIC)
                  </strong>{" "}
                  methodology through {questions.length || 25} rigorous multiple
                  choice questions.
                </p>

                {/* 4 Spec Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="mleaps-glass mleaps-glass-hover rounded-2xl p-4">
                    <div
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="text-2xl font-extrabold text-[#F97316]"
                    >
                      {questions.length || 25}
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      Multiple Choice
                    </div>
                    <div className="text-[11px] text-purple-300/70">
                      Single Best Option
                    </div>
                  </div>

                  <div className="mleaps-glass mleaps-glass-hover rounded-2xl p-4">
                    <div
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="text-2xl font-extrabold text-[#FBBF24]"
                    >
                      40 Min
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      Timed Session
                    </div>
                    <div className="text-[11px] text-purple-300/70">
                      Live Auto-Timer
                    </div>
                  </div>

                  <div className="mleaps-glass mleaps-glass-hover rounded-2xl p-4">
                    <div
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="text-2xl font-extrabold text-emerald-400"
                    >
                      70%
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      Passing Score
                    </div>
                    <div className="text-[11px] text-purple-300/70">
                      18 / 25 Correct
                    </div>
                  </div>

                  <div className="mleaps-glass mleaps-glass-hover rounded-2xl p-4">
                    <div
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="text-2xl font-extrabold text-purple-400"
                    >
                      3.4
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      Target DPMO
                    </div>
                    <div className="text-[11px] text-purple-300/70">
                      6σ Benchmark
                    </div>
                  </div>
                </div>

                {/* Animated 6-Sigma Bell Curve & DMAIC Card */}
                <SixSigmaBellCurveCard />
              </div>

              {/* Right 5 Columns: Strict Email & Time-Window Verification Gate */}
              <div className="lg:col-span-5 animate-slide-right">
                <div
                  className={`mleaps-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.75)] relative overflow-hidden ${
                    shakeError ? "animate-shake" : ""
                  }`}
                >
                  {/* Top Gradient Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#7C3AED]" />

                  <div className="flex items-center justify-between mb-5">
                    <MleapsLogo size="sm" variant="badge" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#7C3AED]/30 border border-purple-400/40 text-purple-200">
                      <Lock className="w-3 h-3 text-[#FBBF24]" /> Time-Window
                      Gated
                    </span>
                  </div>

                  <h2
                    style={{ fontFamily: "var(--font-outfit)" }}
                    className="text-2xl font-extrabold text-white"
                  >
                    Candidate Access Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-200/80 mt-1 mb-6">
                    Only candidates explicitly assigned by the Mleaps Consulting
                    Administrator may attempt this assessment from their
                    registered email within their scheduled time period.
                  </p>

                  <form onSubmit={handleVerifyCandidate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                        Candidate Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#F97316] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#070B16]/90 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                        Assigned Candidate Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#FBBF24] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#070B16]/90 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[#F97316] transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying || isLoadingData}
                      className="w-full py-4 rounded-2xl font-extrabold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:brightness-110 shadow-[0_8px_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>
                        {isVerifying
                          ? "Verifying Email & Time Window..."
                          : "Verify Eligibility & Enter Exam"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Dynamic Verification Result Card */}
                  {verificationResult && (
                    <div
                      className={`mt-5 p-4 rounded-2xl border animate-cross-morph ${
                        verificationResult.allowed
                          ? "bg-emerald-950/35 border-emerald-400/60 text-emerald-100"
                          : verificationResult.code === "ALREADY_COMPLETED"
                          ? "bg-purple-950/45 border-purple-400/60 text-purple-100"
                          : verificationResult.code === "WINDOW_NOT_OPEN"
                          ? "bg-amber-950/40 border-amber-400/60 text-amber-100"
                          : "bg-rose-950/40 border-rose-500/60 text-rose-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {verificationResult.allowed ? (
                            <AnimatedCheckIcon className="w-6 h-6" />
                          ) : (
                            <AnimatedCrossIcon className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="text-xs font-extrabold uppercase tracking-wider">
                            {verificationResult.code === "ACCESS_GRANTED" &&
                              "✓ Authorized Active Window Verified"}
                            {verificationResult.code === "UNASSIGNED_EMAIL" &&
                              "✕ Unauthorized Email Address"}
                            {verificationResult.code === "WINDOW_NOT_OPEN" &&
                              "⏳ Scheduled Window Not Open Yet"}
                            {verificationResult.code === "WINDOW_EXPIRED" &&
                              "✕ Assigned Time Window Expired"}
                            {verificationResult.code === "ALREADY_COMPLETED" &&
                              "✓ Assessment Already Completed"}
                          </div>
                          <p className="text-xs leading-relaxed opacity-90">
                            {verificationResult.message}
                          </p>

                          {verificationResult.allowed &&
                            verificationResult.assignment && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => setCandidateStage("briefing")}
                                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                                >
                                  <span>
                                    Proceed to Official Instruction Sheet &
                                    Start Test
                                  </span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                          {verificationResult.code === "ALREADY_COMPLETED" &&
                            verificationResult.latestAttempt && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompletedAttempt(
                                      verificationResult.latestAttempt!
                                    );
                                    setCandidateStage("scorecard");
                                  }}
                                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>
                                    View Official Scorecard (
                                    {verificationResult.latestAttempt.score}/
                                    {
                                      verificationResult.latestAttempt
                                        .totalQuestions
                                    }{" "}
                                    •{" "}
                                    {
                                      verificationResult.latestAttempt
                                        .percentage
                                    }
                                    %)
                                  </span>
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick-Test Assigned Emails Bar for Instant Evaluation */}
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#FBBF24]">
                        Instant Demo Presets (Click to Test Access States):
                      </span>
                      <button
                        type="button"
                        onClick={() => setWorkspaceMode("admin")}
                        className="text-[11px] font-semibold text-purple-300 hover:text-white underline cursor-pointer"
                      >
                        Manage in Admin →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput("alex.rivera@mleaps.com");
                          setNameInput("Alex Rivera");
                          handleVerifyCandidate(
                            undefined,
                            "alex.rivera@mleaps.com",
                            "Alex Rivera"
                          );
                        }}
                        className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all cursor-pointer"
                      >
                        <div className="text-[10px] font-extrabold text-emerald-300 uppercase">
                          ● Active Assigned Window
                        </div>
                        <div className="text-xs font-mono text-white truncate">
                          alex.rivera@mleaps.com
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput("marcus.vance@mleaps.com");
                          setNameInput("Marcus Vance");
                          handleVerifyCandidate(
                            undefined,
                            "marcus.vance@mleaps.com",
                            "Marcus Vance"
                          );
                        }}
                        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all cursor-pointer"
                      >
                        <div className="text-[10px] font-extrabold text-amber-300 uppercase">
                          ⏳ Future Scheduled Window
                        </div>
                        <div className="text-xs font-mono text-white truncate">
                          marcus.vance@mleaps.com
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput("elena.rostova@mleaps.com");
                          setNameInput("Elena Rostova");
                          handleVerifyCandidate(
                            undefined,
                            "elena.rostova@mleaps.com",
                            "Elena Rostova"
                          );
                        }}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all cursor-pointer"
                      >
                        <div className="text-[10px] font-extrabold text-rose-300 uppercase">
                          ✕ Expired Time Window
                        </div>
                        <div className="text-xs font-mono text-white truncate">
                          elena.rostova@mleaps.com
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput("siddharth.mehta@mleaps.com");
                          setNameInput("Dr. Siddharth Mehta");
                          handleVerifyCandidate(
                            undefined,
                            "siddharth.mehta@mleaps.com",
                            "Dr. Siddharth Mehta"
                          );
                        }}
                        className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-left transition-all cursor-pointer"
                      >
                        <div className="text-[10px] font-extrabold text-purple-200 uppercase">
                          ✓ Completed (92% Pass)
                        </div>
                        <div className="text-xs font-mono text-white truncate">
                          siddharth.mehta@mleaps.com
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 px-4 sm:px-8 mt-12 bg-[#070B16]/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-purple-300/70">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Mleaps Consulting</span>
            <span>•</span>
            <span>
              Six Sigma Green Belt Certification Assessment (DMAIC Standard)
            </span>
          </div>
          <div>
            25 Multiple Choice Questions • 40 Minutes Duration • 70% (18/25)
            Passing Threshold
          </div>
        </div>
      </footer>
    </div>
  );
}
