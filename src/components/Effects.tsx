"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
  CSSProperties,
} from "react";

/* ============================================================
   1. CONSTELLATION CANVAS — living particle network
   ============================================================ */
export function ConstellationCanvas({
  className = "",
  maxParticles = 70,
}: {
  className?: string;
  maxParticles?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    const resize = () => {
      const host = canvas.parentElement;
      width = host ? host.clientWidth : window.innerWidth;
      height = host ? host.clientHeight : window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round((width * height) / 20000);
      const count = Math.max(22, Math.min(maxParticles, target));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.5,
      }));
    };

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const m = mouseRef.current;

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(217,180,91,0.5)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 118) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139,123,216,${(1 - d / 118) * 0.16})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (d < 165) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = `rgba(243,220,164,${(1 - d / 165) * 0.3})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [maxParticles]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

/* ============================================================
   2. REVEAL — scroll-triggered entrance
   ============================================================ */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  x = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown
          ? "translate3d(0,0,0)"
          : `translate3d(${x}px, ${y}px, 0)`,
        filter: shown ? "blur(0px)" : "blur(5px)",
        transition: `opacity .85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .85s cubic-bezier(.22,1,.36,1) ${delay}ms, filter .85s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   3. LUXE CARD — 3D tilt + cursor spotlight
   ============================================================ */
export function LuxeCard({
  children,
  className = "",
  tilt = 6,
  as: _as,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  as?: never;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      setStyle({
        transform: `perspective(1200px) rotateX(${(0.5 - py) * tilt * 2}deg) rotateY(${
          (px - 0.5) * tilt * 2
        }deg)`,
        ["--mx" as string]: `${px * 100}%`,
        ["--my" as string]: `${py * 100}%`,
      } as CSSProperties);
    },
    [tilt]
  );

  const handleLeave = useCallback(() => {
    setStyle({ transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)" });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
      className={`luxe ${className}`}
    >
      {children}
    </div>
  );
}

/* ============================================================
   4. COUNT UP — animated numerals on view
   ============================================================ */
export function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: {
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ============================================================
   5. MARQUEE — infinite ticker
   ============================================================ */
export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-host relative overflow-hidden py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#04070f] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#04070f] to-transparent z-10" />
      <div className="marquee-track gap-10">
        {doubled.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="flex items-center gap-10 text-[11px] kicker text-[#8b95ad] whitespace-nowrap"
          >
            {t}
            <span className="w-1 h-1 rounded-full bg-[#d9b45b]" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   6. MAGNETIC BUTTON — pulls toward cursor
   ============================================================ */
export function Magnetic({
  children,
  className = "",
  strength = 10,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [t, setT] = useState("translate(0px, 0px)");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * strength * 2;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * strength * 2;
        setT(`translate(${dx}px, ${dy}px)`);
      }}
      onMouseLeave={() => setT("translate(0px, 0px)")}
      style={{ transform: t, transition: "transform .35s cubic-bezier(.22,1,.36,1)" }}
      className={className}
    >
      {children}
    </button>
  );
}

/* ============================================================
   7. PROGRESS RING — animated gold gauge
   ============================================================ */
export function GoldRing({
  percent,
  size = 180,
  stroke = 12,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const id = setTimeout(() => setOffset(c * (1 - percent / 100)), 180);
    return () => clearTimeout(id);
  }, [c, percent]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a8822f" />
            <stop offset="45%" stopColor="#f3dca4" />
            <stop offset="100%" stopColor="#8b7bd8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   8. CHECK / CROSS GLYPHS
   ============================================================ */
export function CheckGlyph({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12.5" fill="rgba(16,185,129,0.12)" stroke="#34d399" strokeWidth="1.3" />
      <path
        d="M8.5 14.4L12.2 18.1L19.7 10.2"
        stroke="#34d399"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="140"
        className="animate-[drawStroke_.55s_ease-out_forwards]"
      />
    </svg>
  );
}

export function CrossGlyph({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12.5" fill="rgba(244,63,94,0.12)" stroke="#fb7185" strokeWidth="1.3" />
      <path
        d="M9.6 9.6L18.4 18.4"
        stroke="#fb7185"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeDasharray="140"
        className="animate-[drawStroke_.45s_ease-out_forwards]"
      />
      <path
        d="M18.4 9.6L9.6 18.4"
        stroke="#fb7185"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeDasharray="140"
        className="animate-[drawStroke_.6s_ease-out_forwards]"
      />
    </svg>
  );
}
