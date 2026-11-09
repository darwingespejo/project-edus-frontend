"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Award, Bug, Compass, Flame, Footprints, Handshake, Orbit, Zap } from "lucide-react";
import { OrbitMark } from "./Logo";

export type EarnedBadge = { code: string; name: string; description: string; icon: string; accent: string; xpReward: number };

export const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  compass: Compass, footprints: Footprints, flame: Flame, bug: Bug,
  handshake: Handshake, zap: Zap, orbit: Orbit, award: Award,
};

export const ACCENT_COLOR: Record<string, string> = {
  indigo: "var(--primary)", mint: "var(--mint)", amber: "var(--amber)", coral: "var(--coral)",
};

export function fireConfetti() {
  const colors = ["#134a7c", "#14736f", "#b4711b", "#2f7ab5", "#c24545"];
  confetti({ particleCount: 130, spread: 75, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true }), 180);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true }), 320);
}

// Stack of earned badges shown one at a time. First open fires confetti — exclamation earned.
export function BadgeModal({ badges, onClose }: { badges: EarnedBadge[]; onClose: () => void }) {
  const badge = badges[0] ?? null;
  useEffect(() => { if (badge) fireConfetti(); }, [badge]);
  if (!badge) return null;
  const Icon = BADGE_ICONS[badge.icon] ?? Award;
  const color = ACCENT_COLOR[badge.accent] ?? "var(--amber)";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="card relative p-8 md:p-10 max-w-sm w-full text-center overflow-hidden"
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(60% 50% at 50% 0%, ${color}33, transparent)` }} />
          <p className="eyebrow">Badge earned</p>
          <motion.div
            className="mx-auto my-6 w-24 h-24 rounded-full grid place-items-center"
            style={{ background: `${color}22`, boxShadow: `0 0 40px ${color}55` }}
            initial={{ rotate: -8, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
          >
            <span style={{ color }}><Icon size={44} /></span>
          </motion.div>
          <h3 className="display text-2xl font-bold">{badge.name}</h3>
          <p className="text-muted text-sm mt-2 leading-relaxed">{badge.description}</p>
          {badge.xpReward > 0 && <p className="font-mono text-amber text-sm mt-3">+{badge.xpReward} XP</p>}
          <button className="btn btn-primary w-full mt-6" onClick={onClose}>
            {badges.length > 1 ? `Next badge (${badges.length - 1} more)` : "Back to it"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function BadgeIcon({ badge, size = 40 }: { badge: { icon: string; accent: string }; size?: number }) {
  const Icon = BADGE_ICONS[badge.icon] ?? OrbitMark;
  const color = ACCENT_COLOR[badge.accent] ?? "var(--amber)";
  return (
    <div className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: `${color}1c` }}>
      <span style={{ color }}><Icon size={Math.round(size * 0.52)} /></span>
    </div>
  );
}
