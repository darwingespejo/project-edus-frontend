"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ---------- Magnetic: primary CTAs drift toward the cursor, springing back on leave ---------- */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- TiltCard: 3D perspective tilt with a cursor-tracking sheen ---------- */
export function TiltCard({ children, className = "", max = 9 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        className={className}
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          ry.set((px - 0.5) * max);
          rx.set(-(py - 0.5) * max);
          ref.current!.style.setProperty("--sheen-x", `${px * 100}%`);
          ref.current!.style.setProperty("--sheen-y", `${py * 100}%`);
        }}
        onPointerLeave={() => { rx.set(0); ry.set(0); }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- OrbitField: living constellation canvas.
   Points drift on slow ellipses at three depths, near points link with hairlines,
   and the pointer gently perturbs everything within its radius. Reduced-motion renders one static frame. ---------- */
export function OrbitField({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const pointer = { x: -9999, y: -9999 };

    type P = { ax: number; ay: number; rx: number; ry: number; speed: number; phase: number; depth: number };
    let pts: P[] = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 26000) * density);
      pts = Array.from({ length: count }, (_, i) => ({
        ax: Math.random() * w,
        ay: Math.random() * h,
        rx: 8 + Math.random() * 30,
        ry: 6 + Math.random() * 22,
        speed: (0.12 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1),
        phase: (i / count) * Math.PI * 2 + Math.random(),
        depth: 0.35 + Math.random() * 0.65,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const positions = pts.map((p) => {
        const a = p.phase + t * 0.00018 * p.speed * 60;
        let x = p.ax + Math.cos(a) * p.rx * p.depth;
        let y = p.ay + Math.sin(a) * p.ry * p.depth;
        const dx = x - pointer.x, dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 150 * 150) {
          const d = Math.sqrt(d2) || 1;
          const f = ((150 - d) / 150) * 18 * p.depth;
          x += (dx / d) * f; y += (dy / d) * f;
        }
        return { x, y, depth: p.depth };
      });

      // hairline links under a depth-weighted threshold
      const LINK = 96;
      const blue = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#134a7c";
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const a = (1 - Math.sqrt(d2) / LINK) * 0.24 * Math.min(positions[i].depth, positions[j].depth);
            ctx.strokeStyle = hexToRgba(blue, a);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of positions) {
        ctx.fillStyle = hexToRgba(blue, 0.32 + p.depth * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1 + p.depth * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };

    resize();
    if (reduced) draw(4000); else raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />;
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(19,74,124,${a})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------- Marquee: infinite term ticker, duplicated content for a seamless loop ---------- */
export function Marquee({ items, speed = 26 }: { items: string[]; speed?: number }) {
  const row = items.map((t, i) => (
    <span key={i} className="mx-6 inline-flex items-center gap-6 font-mono text-[12px] tracking-[0.14em] uppercase text-muted whitespace-nowrap">
      {t} <span className="w-1 h-1 rounded-full bg-mint inline-block" />
    </span>
  ));
  return (
    <div className="relative overflow-hidden border-y border-line py-3.5 select-none" aria-hidden>
      <div className="flex w-max" style={{ animation: `marquee ${speed}s linear infinite` }}>
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
      <style>{`@keyframes marquee { to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ---------- ScrollFloat: parallax-y wrapper for image bands ---------- */
export function ParallaxY({ children, amount = 46, className = "" }: { children: React.ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prog = useMotionValue(0);
  const y = useTransform(prog, [0, 1], [-amount, amount]);
  useEffect(() => {
    const onScroll = () => {
      const element = ref.current;
      if (!element) return;
      const r = element.getBoundingClientRect();
      const vh = window.innerHeight;
      prog.set(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [prog]);
  return <motion.div ref={ref} style={{ y }} className={className}>{children}</motion.div>;
}
