"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function CountUp({ value, duration = 900, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduceMotion = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setV(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, value, duration]);

  return <span ref={ref} className="tabular-nums font-mono">{v.toLocaleString()}{suffix}</span>;
}

export function Ring({ value, size = 92, stroke = 8, color = "var(--primary)", track = "var(--raised)", label }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; label?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));
  const dashOffset = c * (1 - v / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          ref={ref}
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={reduceMotion ? false : { strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: dashOffset } : {}}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{label}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, accent = "var(--primary)", children }: {
  label: string; value: React.ReactNode; sub?: string; accent?: string; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="card p-5 relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-25 blur-2xl" style={{ background: accent }} />
      <p className="eyebrow">{label}</p>
      <div className="mt-2 text-[26px] font-semibold display leading-none">{value}</div>
      {sub && <p className="text-muted text-xs mt-1.5">{sub}</p>}
      {children}
    </motion.div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="display text-[20px] font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-muted text-sm mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: {
  icon: React.ReactNode; title: string; body: string; action?: React.ReactNode;
}) {
  return (
    <div className="card p-10 flex flex-col items-center text-center gap-3 border-dashed">
      <div className="w-12 h-12 rounded-full grid place-items-center text-primary bg-raised">{icon}</div>
      <h3 className="display font-bold text-lg">{title}</h3>
      <p className="text-muted text-sm max-w-sm">{body}</p>
      {action}
    </div>
  );
}

export function SkillBar({ name, value, color = "var(--primary)" }: { name: string; value: number; color?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium">{name}</span>
        <span className="font-mono text-muted">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-raised overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, var(--mint))` }}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="display text-[28px] md:text-[32px] font-bold tracking-tight leading-tight">{title}</h1>
        {sub && <p className="text-muted mt-1 text-[15px] max-w-2xl">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
