"use client";

import React from "react";

export function AnimatedCheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="14"
        cy="14"
        r="12"
        className="fill-emerald-500/20 stroke-emerald-400"
        strokeWidth="2"
      />
      <path
        d="M8.5 14.5L12.2 18.2L19.8 10.2"
        stroke="#10B981"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="30"
        strokeDashoffset="0"
        className="animate-[crossLineDraw_0.45s_ease-out_forwards]"
      />
    </svg>
  );
}

export function AnimatedCrossIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="14"
        cy="14"
        r="12"
        className="fill-rose-500/20 stroke-rose-400"
        strokeWidth="2"
      />
      <path
        d="M9.5 9.5L18.5 18.5"
        stroke="#F43F5E"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="30"
        strokeDashoffset="0"
        className="animate-[crossLineDraw_0.35s_ease-out_forwards]"
      />
      <path
        d="M18.5 9.5L9.5 18.5"
        stroke="#F43F5E"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="30"
        strokeDashoffset="0"
        className="animate-[crossLineDraw_0.45s_ease-out_forwards]"
      />
    </svg>
  );
}

export function SixSigmaBellCurveCard() {
  const dmaicSteps = [
    {
      letter: "D",
      name: "Define",
      desc: "Charter, VOC & CTQ",
      color: "from-[#F97316] to-[#FB923C]",
    },
    {
      letter: "M",
      name: "Measure",
      desc: "Baseline, Gage R&R, Cpk",
      color: "from-[#FB923C] to-[#FBBF24]",
    },
    {
      letter: "A",
      name: "Analyze",
      desc: "Pareto, Fishbone, FMEA",
      color: "from-[#A855F7] to-[#7E22CE]",
    },
    {
      letter: "I",
      name: "Improve",
      desc: "Kaizen, Poka-Yoke, Muda",
      color: "from-[#7E22CE] to-[#7C3AED]",
    },
    {
      letter: "C",
      name: "Control",
      desc: "Control Charts & Plan",
      color: "from-[#7C3AED] to-[#4C1D95]",
    },
  ];

  return (
    <div className="mleaps-glass rounded-3xl p-6 border border-white/10 relative overflow-hidden group">
      {/* Ambient Background Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#F97316]/15 blur-3xl pointer-events-none group-hover:bg-[#F97316]/25 transition-all duration-700" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#7C3AED]/25 blur-3xl pointer-events-none group-hover:bg-[#7C3AED]/35 transition-all duration-700" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#FBBF24] block">
            Statistical Process Target
          </span>
          <h3
            style={{ fontFamily: "var(--font-outfit)" }}
            className="text-lg font-bold text-white"
          >
            Six Sigma (6σ) Normal Distribution — 3.4 DPMO
          </h3>
        </div>
        <span
          style={{ fontFamily: "var(--font-mono)" }}
          className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#F97316]/20 to-[#7C3AED]/30 border border-[#F97316]/40 text-[#FBBF24]"
        >
          99.99966% Yield
        </span>
      </div>

      {/* Animated SVG Bell Curve */}
      <div className="relative bg-[#070B16]/70 rounded-2xl p-4 border border-white/5 mb-5">
        <svg
          viewBox="0 0 500 145"
          className="w-full h-32 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bellFillGrad" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.05" />
              <stop offset="30%" stopColor="#F97316" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="bellStrokeGrad" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          {/* Grid Baseline */}
          <line x1="20" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* LSL & USL Specification Limit Dashed Lines */}
          <line x1="65" y1="18" x2="65" y2="120" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="45" y="14" fill="#FB7185" fontSize="10" fontWeight="700" fontFamily="monospace">
            LSL (-6σ)
          </text>

          <line x1="435" y1="18" x2="435" y2="120" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="410" y="14" fill="#FB7185" fontSize="10" fontWeight="700" fontFamily="monospace">
            USL (+6σ)
          </text>

          {/* Center Mean Line (μ) */}
          <line x1="250" y1="15" x2="250" y2="120" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="234" y="12" fill="#FBBF24" fontSize="10" fontWeight="700" fontFamily="monospace">
            μ (Target)
          </text>

          {/* Bell Curve Shaded Area */}
          <path
            d="M 25 120 C 110 120, 160 115, 195 65 C 220 28, 235 18, 250 18 C 265 18, 280 28, 305 65 C 340 115, 390 120, 475 120 Z"
            fill="url(#bellFillGrad)"
          />

          {/* Bell Curve Stroke */}
          <path
            d="M 25 120 C 110 120, 160 115, 195 65 C 220 28, 235 18, 250 18 C 265 18, 280 28, 305 65 C 340 115, 390 120, 475 120"
            stroke="url(#bellStrokeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sigma Markers along X-axis */}
          {[
            { x: 65, label: "-6σ" },
            { x: 125, label: "-3σ" },
            { x: 190, label: "-1.5σ" },
            { x: 250, label: "0σ" },
            { x: 310, label: "+1.5σ" },
            { x: 375, label: "+3σ" },
            { x: 435, label: "+6σ" },
          ].map((m) => (
            <g key={m.label}>
              <circle cx={m.x} cy="120" r="3" fill="#FBBF24" />
              <text
                x={m.x}
                y="136"
                textAnchor="middle"
                fill="#C4B5FD"
                fontSize="9.5"
                fontFamily="monospace"
              >
                {m.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* 5-Step Animated DMAIC Methodology Strip */}
      <div className="grid grid-cols-5 gap-2">
        {dmaicSteps.map((step, i) => (
          <div
            key={step.name}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-slide-up bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl p-2.5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#F97316]/50"
          >
            <div
              className={`w-7 h-7 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}
            >
              {step.letter}
            </div>
            <div className="text-xs font-bold text-white truncate">{step.name}</div>
            <div className="text-[10px] text-purple-200/70 truncate mt-0.5">
              {step.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
