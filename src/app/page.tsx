"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Question, CandidateAssignment, ExamAttempt } from "@/db/schema";
import { MleapsLogo } from "@/components/MleapsLogo";
import { BellCurvePanel, CheckMark, CrossMark } from "@/components/SixSigmaVisuals";
import { LiveExamArena } from "@/components/LiveExamArena";
import { ScorecardView } from "@/components/ScorecardView";
import { AdminDashboard } from "@/components/AdminDashboard";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  FileText,
  GraduationCap,
  Settings,
  Play,
  Eye,
  Award,
  Clock,
  CircleCheck,
  Hourglass,
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

export default function AssessmentPlatform() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("candidate");
  const [candidateStage, setCandidateStage] = useState<CandidateStage>("verify");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [emailInput, setEmailInput] = useState("fake.candidate@mleaps.com");
  const [nameInput, setNameInput] = useState("Demo Candidate (Fake Profile)");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [activeAssignment, setActiveAssignment] =
    useState<CandidateAssignment | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<ExamAttempt | null>(
    null
  );
  const [shakeError, setShakeError] = useState(false);

  const fetchAllPlatformData = useCallback(async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        fetch("/api/questions"),
        fetch("/api/assignments"),
      ]);
      if (qRes.ok) setQuestions((await qRes.json()).questions || []);
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
        body: JSON.stringify({ email: targetEmail, candidateName: targetName }),
      });
      const data: VerificationResult = await res.json();
      setVerificationResult(data);
      if (data.allowed && data.assignment) {
        setActiveAssignment(data.assignment);
        if (!targetName && data.assignment.candidateName)
          setNameInput(data.assignment.candidateName);
      } else {
        setShakeError(true);
        setTimeout(() => setShakeError(false), 550);
      }
    } catch {
      setVerificationResult({
        allowed: false,
        code: "SERVER_ERROR",
        message: "Unable to verify eligibility. Please try again.",
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
      if (data.questions) setQuestions(data.questions);
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

  // ============ FULL-SCREEN EXAM ARENA ============
  if (
    workspaceMode === "candidate" &&
    candidateStage === "exam" &&
    activeAssignment
  ) {
    return (
      <LiveExamArena
        questions={questions}
        assignment={activeAssignment}
        candidateName={nameInput || activeAssignment.candidateName}
        candidateEmail={emailInput || activeAssignment.candidateEmail}
        onSubmitExam={handleSubmitExamAttempt}
        onCancelExam={() => setCandidateStage("briefing")}
      />
    );
  }

  const presets = [
    {
      email: "fake.candidate@mleaps.com",
      name: "Demo Candidate (Fake Profile)",
      label: "Fake Profile · Active 48h",
      Icon: CircleCheck,
      tone: "text-amber-800 border-amber-300 bg-amber-50/90 font-bold",
    },
    {
      email: "alex.rivera@mleaps.com",
      name: "Alex Rivera",
      label: "Active 48h window",
      Icon: CircleCheck,
      tone: "text-emerald-700 border-emerald-200 bg-emerald-50/60",
    },
    {
      email: "marcus.vance@mleaps.com",
      name: "Marcus Vance",
      label: "Scheduled",
      Icon: Hourglass,
      tone: "text-amber-700 border-amber-200 bg-amber-50/60",
    },
    {
      email: "elena.rostova@mleaps.com",
      name: "Elena Rostova",
      label: "Expired",
      Icon: Clock,
      tone: "text-rose-700 border-rose-200 bg-rose-50/60",
    },
    {
      email: "siddharth.mehta@mleaps.com",
      name: "Dr. Siddharth Mehta",
      label: "Completed · 92%",
      Icon: Award,
      tone: "text-violet-700 border-violet-200 bg-violet-50/60",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient soft wash */}
      <div className="pointer-events-none fixed -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#f97316]/8 blur-[150px] drift-slow" />
      <div className="pointer-events-none fixed top-1/4 -right-40 w-[560px] h-[560px] rounded-full bg-[#7c3aed]/8 blur-[160px] drift-slow-2" />

      {/* ============ TOP NAV ============ */}
      <header className="sticky top-0 z-40 bg-[#faf9f6]/85 backdrop-blur-xl border-b border-[#e8e4db]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
          <div
            onClick={() => {
              setWorkspaceMode("candidate");
              setCandidateStage("verify");
            }}
            className="flex items-center gap-4 cursor-pointer"
          >
            <MleapsLogo size="sm" />
            <div className="hidden lg:block pl-4 border-l border-[#e8e4db]">
              <div className="eyebrow text-[#c4530a]">
                Certification Authority
              </div>
              <div className="font-display text-[15px] font-semibold text-[#15172a] leading-tight">
                Six Sigma Green Belt Assessment
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full border border-[#e8e4db] bg-white">
            <button
              type="button"
              onClick={() => setWorkspaceMode("candidate")}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${
                workspaceMode === "candidate"
                  ? "bg-[#15172a] text-white shadow-sm"
                  : "text-[#6b6e80] hover:text-[#15172a]"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode("admin")}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${
                workspaceMode === "admin"
                  ? "bg-[#15172a] text-white shadow-sm"
                  : "text-[#6b6e80] hover:text-[#15172a]"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Administration</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
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
            backLabel="Return to verification"
          />
        ) : candidateStage === "briefing" && activeAssignment ? (
          /* ============ BRIEFING / COVER SHEET ============ */
          <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 fade-soft">
            <div className="card-premium rounded-3xl overflow-hidden">
              <div className="h-1 rule-accent line-grow" />
              <div className="p-7 sm:p-11">
                <div className="flex items-start justify-between gap-6 pb-7 border-b border-[#eceae4]">
                  <MleapsLogo size="md" />
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                    <div className="text-xs text-[#9a9a90] mt-1.5 font-data">
                      Closes{" "}
                      {new Date(activeAssignment.validUntil).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <span className="eyebrow text-[#c4530a]">
                    Certification Examination
                  </span>
                  <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#15172a] mt-2 leading-[1.05]">
                    Six Sigma
                    <br />
                    <span className="italic text-accent-gradient">
                      Green Belt
                    </span>{" "}
                    Assessment
                  </h1>
                  <p className="text-[#747789] mt-4 leading-relaxed max-w-xl">
                    You are about to begin a proctored evaluation of{" "}
                    {questions.length} questions spanning the full DMAIC body of
                    knowledge. Please read the protocol below before you begin.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-8 rounded-2xl overflow-hidden border border-[#eceae4] bg-[#eceae4]">
                  {[
                    { k: "Questions", v: `${questions.length}` },
                    { k: "Duration", v: `${activeAssignment.durationMinutes}m` },
                    { k: "Format", v: "MCQ · A–D" },
                    { k: "Pass mark", v: "70%" },
                  ].map((s) => (
                    <div key={s.k} className="bg-white p-4 text-center">
                      <div className="font-display text-2xl font-semibold text-[#15172a]">
                        {s.v}
                      </div>
                      <div className="eyebrow text-[#9a9a90] mt-1">{s.k}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                  <div>
                    <label className="eyebrow text-[#9a9a90] block mb-2">
                      Candidate name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e0dccf] text-[#15172a] font-medium focus:outline-none focus:border-[#e2630f] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="eyebrow text-[#9a9a90] block mb-2">
                      Authorized email
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-[#f4f2ec] border border-[#e8e4db] text-[#6b6e80] font-data text-sm truncate">
                      {emailInput}
                    </div>
                  </div>
                </div>

                <div className="inset-panel rounded-2xl p-5 mt-7">
                  <div className="flex items-center gap-2 eyebrow text-[#c4530a] mb-2">
                    <FileText className="w-3.5 h-3.5" /> Examination protocol
                  </div>
                  <p className="text-sm text-[#5b5e70] leading-relaxed">
                    Read each question carefully and select the single best
                    answer (A, B, C, or D). There is exactly one correct answer
                    per question, and no penalty for incorrect responses. The
                    timer begins the moment you enter the examination room and
                    submits automatically when it expires. A detailed scorecard
                    with explanations is issued immediately upon submission.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-9">
                  <button
                    type="button"
                    onClick={() => setCandidateStage("verify")}
                    className="text-sm font-medium text-[#6b6e80] hover:text-[#15172a] transition-colors cursor-pointer"
                  >
                    ← Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateStage("exam")}
                    className="group inline-flex items-center gap-3 pl-7 pr-6 py-4 rounded-full bg-[#15172a] text-white font-medium shadow-lg hover:bg-[#242740] transition-all cursor-pointer halo-pulse"
                  >
                    <span>Enter examination room</span>
                    <span className="w-8 h-8 rounded-full bg-[#e2630f] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============ LANDING / VERIFICATION ============ */
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* LEFT — editorial */}
              <div className="lg:col-span-7 reveal-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e2630f]/25 bg-[#fff6ec]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e2630f] animate-pulse" />
                  <span className="eyebrow text-[#c4530a]">
                    Mleaps Consulting · Accredited Program
                  </span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.6rem] font-semibold text-[#15172a] mt-6 leading-[1.02] tracking-tight">
                  The standard for
                  <br />
                  <span className="italic shimmer-accent">operational</span>{" "}
                  excellence.
                </h1>

                <p className="text-lg text-[#5b5e70] mt-6 leading-relaxed max-w-xl">
                  A rigorous, proctored{" "}
                  <span className="text-[#15172a] font-medium">
                    Six Sigma Green Belt
                  </span>{" "}
                  certification assessment — measuring true mastery across
                  Define, Measure, Analyze, Improve, and Control.
                </p>

                {/* stat row */}
                <div className="flex flex-wrap items-stretch gap-px mt-10 rounded-2xl overflow-hidden border border-[#e8e4db] bg-[#e8e4db] max-w-xl">
                  {[
                    { v: `${questions.length || 25}`, k: "Questions" },
                    { v: "40", k: "Minutes" },
                    { v: "70%", k: "To pass" },
                    { v: "3.4", k: "Target DPMO" },
                  ].map((s, i) => (
                    <div
                      key={s.k}
                      style={{ animationDelay: `${i * 90}ms` }}
                      className="count-up bg-[#faf9f6] px-5 py-4 flex-1 min-w-[90px]"
                    >
                      <div className="font-display text-3xl font-semibold text-[#15172a]">
                        {s.v}
                      </div>
                      <div className="eyebrow text-[#9a9a90] mt-1">{s.k}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <BellCurvePanel />
                </div>
              </div>

              {/* RIGHT — verification gate */}
              <div className="lg:col-span-5 reveal-right lg:sticky lg:top-28">
                <div
                  className={`card-premium rounded-3xl overflow-hidden ${
                    shakeError ? "animate-shake" : ""
                  }`}
                >
                  <div className="h-1 rule-accent" />
                  <div className="p-7 sm:p-9">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-full bg-[#15172a] flex items-center justify-center">
                        <Lock className="w-5 h-5 text-[#f9b233]" />
                      </div>
                      <span className="eyebrow text-[#9a9a90]">
                        Secure Access
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-semibold text-[#15172a]">
                      Candidate verification
                    </h2>
                    <p className="text-sm text-[#747789] mt-2 mb-7 leading-relaxed">
                      Access is restricted to candidates invited by the
                      administrator, from their registered email, within their
                      assigned window.
                    </p>

                    <form onSubmit={handleVerifyCandidate} className="space-y-4">
                      <div>
                        <label className="eyebrow text-[#9a9a90] block mb-2">
                          Full name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#c4530a] absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Your full name"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#faf9f6] border border-[#e0dccf] text-[#15172a] text-sm focus:outline-none focus:border-[#e2630f] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="eyebrow text-[#9a9a90] block mb-2">
                          Registered email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#6d28d9] absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#faf9f6] border border-[#e0dccf] text-[#15172a] text-sm font-data focus:outline-none focus:border-[#e2630f] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifying || isLoadingData}
                        className="w-full group inline-flex items-center justify-center gap-2.5 py-4 rounded-xl bg-[#15172a] text-white font-medium hover:bg-[#242740] shadow-md transition-all cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {isVerifying ? "Verifying…" : "Verify eligibility"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </form>

                    {/* result */}
                    {verificationResult && (
                      <div
                        className={`mt-5 p-4 rounded-2xl border fade-soft ${
                          verificationResult.allowed
                            ? "bg-emerald-50/70 border-emerald-200"
                            : verificationResult.code === "ALREADY_COMPLETED"
                            ? "bg-violet-50/70 border-violet-200"
                            : verificationResult.code === "WINDOW_NOT_OPEN"
                            ? "bg-amber-50/70 border-amber-200"
                            : "bg-rose-50/70 border-rose-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {verificationResult.allowed ? (
                              <CheckMark className="w-6 h-6" />
                            ) : (
                              <CrossMark className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold text-[#15172a]">
                              {verificationResult.code === "ACCESS_GRANTED" &&
                                "Access granted"}
                              {verificationResult.code === "UNASSIGNED_EMAIL" &&
                                "Email not authorized"}
                              {verificationResult.code === "WINDOW_NOT_OPEN" &&
                                "Window not open yet"}
                              {verificationResult.code === "WINDOW_EXPIRED" &&
                                "Window expired"}
                              {verificationResult.code === "ALREADY_COMPLETED" &&
                                "Already completed"}
                              {(verificationResult.code === "INVALID_INPUT" ||
                                verificationResult.code === "SERVER_ERROR") &&
                                "Unable to verify"}
                            </div>
                            <p className="text-xs text-[#5b5e70] leading-relaxed">
                              {verificationResult.message}
                            </p>

                            {verificationResult.allowed &&
                              verificationResult.assignment && (
                                <button
                                  type="button"
                                  onClick={() => setCandidateStage("briefing")}
                                  className="mt-1 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer"
                                >
                                  Continue to protocol
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}

                            {verificationResult.code === "ALREADY_COMPLETED" &&
                              verificationResult.latestAttempt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompletedAttempt(
                                      verificationResult.latestAttempt!
                                    );
                                    setCandidateStage("scorecard");
                                  }}
                                  className="mt-1 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#15172a] hover:bg-[#242740] text-white text-sm font-medium transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  View scorecard (
                                  {verificationResult.latestAttempt.percentage}%)
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* demo presets */}
                    <div className="mt-7 pt-6 border-t border-[#eceae4]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow text-[#9a9a90]">
                          Demo identities
                        </span>
                        <button
                          type="button"
                          onClick={() => setWorkspaceMode("admin")}
                          className="text-xs font-medium text-[#c4530a] hover:underline cursor-pointer"
                        >
                          Manage →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {presets.map((p) => (
                          <button
                            key={p.email}
                            type="button"
                            onClick={() => {
                              setEmailInput(p.email);
                              setNameInput(p.name);
                              handleVerifyCandidate(undefined, p.email, p.name);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all hover:shadow-sm cursor-pointer ${p.tone}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <p.Icon className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold">
                                {p.label}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#6b6e80] font-data truncate mt-0.5">
                              {p.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-[#e8e4db] bg-[#faf9f6]/70 mt-16 no-print">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MleapsLogo size="xs" />
          </div>
          <p className="text-xs text-[#9a9a90]">
            Six Sigma Green Belt Certification · 25 questions · 40 minutes · 70%
            threshold · © {new Date().getFullYear()} Mleaps Consulting
          </p>
        </div>
      </footer>
    </div>
  );
}
