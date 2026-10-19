"use client";

import React from "react";

interface MleapsLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "badge" | "light";
  animated?: boolean;
  className?: string;
}

export function MleapsLogo({
  size = "md",
  variant = "dark",
  animated = true,
  className = "",
}: MleapsLogoProps) {
  const dimensions = {
    sm: { width: 145, height: 58 },
    md: { width: 190, height: 76 },
    lg: { width: 250, height: 100 },
    xl: { width: 320, height: 128 },
  }[size];

  const isBadge = variant === "badge";
  const consultingColor =
    variant === "light" || variant === "badge" ? "#1E1B2E" : "#E2DCF5";

  return (
    <div
      className={`inline-flex items-center select-none group ${
        isBadge
          ? "bg-white/95 px-4 py-2 rounded-2xl shadow-[0_8px_30px_rgba(255,107,0,0.22)] border border-white/40 backdrop-blur-md"
          : ""
      } ${className}`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 460 185"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Mleaps Ascending Orange-to-Amber Gradient */}
          <linearGradient
            id="mleapsOrangeGrad"
            x1="20"
            y1="145"
            x2="185"
            y2="12"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FF5500" />
            <stop offset="52%" stopColor="#FF8800" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>

          {/* Mleaps Royal Violet-to-Indigo Gradient */}
          <linearGradient
            id="mleapsPurpleGrad"
            x1="145"
            y1="40"
            x2="430"
            y2="155"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6E00F5" />
            <stop offset="45%" stopColor="#5200B8" />
            <stop offset="100%" stopColor="#35007A" />
          </linearGradient>

          {/* Subtle Glow Filter for Kinetic Arrow */}
          <filter
            id="mleapsArrowGlow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ORANGE "M" WITH DOUBLE CHEVRON & ASCENDING ARROW */}
        <g
          className={
            animated
              ? "transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              : ""
          }
        >
          {/* Left stem + Upper V + Ascending Arrow shaft & head */}
          <path
            d="M 24 134 L 24 34 L 44 34 L 96 86 L 154 28 L 141 18 L 185 8 L 173 50 L 164 38 L 96 106 L 42 52 L 42 134 Z"
            fill="url(#mleapsOrangeGrad)"
            filter={animated ? "url(#mleapsArrowGlow)" : undefined}
          />

          {/* Lower Nested Chevron inside M connecting toward the purple 'l' stem */}
          <path
            d="M 54 74 L 96 116 L 146 66 L 146 84 L 96 134 L 54 92 Z"
            fill="url(#mleapsOrangeGrad)"
          />
        </g>

        {/* PURPLE "leaps" WORDMARK */}
        <g>
          {/* The vertical 'l' stem with angled top cut matching the orange arrow */}
          <path
            d="M 146 65 L 168 43 L 168 134 L 146 134 Z"
            fill="url(#mleapsPurpleGrad)"
          />

          {/* Geometric lowercase "eaps" */}
          <text
            x="174"
            y="134"
            fill="url(#mleapsPurpleGrad)"
            fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="94"
            letterSpacing="-2"
          >
            eaps
          </text>
        </g>

        {/* "C O N S U L T I N G" SUBTITLE */}
        <text
          x="24"
          y="167"
          fill={consultingColor}
          fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="20"
          letterSpacing="14.5"
        >
          CONSULTING
        </text>
      </svg>
    </div>
  );
}
