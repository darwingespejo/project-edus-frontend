"use client";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { PageHeader } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import { useAuth } from "@/lib/store";

type Board = { rows: { id: string; name: string; xp: number; level: number; streak: number }[]; meRank: number | null };

const MEDAL = ["var(--amber)", "#B9C0D9", "#C98B5E"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data, loading } = useApi<Board>("/api/v1/analytics/leaderboard");
  if (loading) return <SphereLoader label="Ranking the class" />;
  if (!data) return <p className="text-muted">Could not load the leaderboard.</p>;

  return (
    <div>
      <PageHeader title="Leaderboard" sub="Students only, ranked by XP. XP comes from lessons, passed tests, reviews, streaks, and badge bonuses — re-running the same code past your old best earns nothing." />
      <div className="card overflow-hidden">
        {data.rows.map((r, i) => {
          const me = r.id === user?.id;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-line/60 last:border-0 ${me ? "bg-primary/8 border-l-2 border-l-primary" : ""}`}>
              <span className="w-8 text-center font-mono font-bold text-sm" style={{ color: i < 3 ? MEDAL[i] : "var(--muted)" }}>
                {i < 3 ? <Trophy size={15} className="mx-auto" /> : `#${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.name}{me && <span className="text-primary text-xs ml-2">you</span>}</p>
                <p className="font-mono text-[11px] text-muted">level {r.level}</p>
              </div>
              <span className="hidden sm:flex items-center gap-1 font-mono text-xs text-amber"><Flame size={12} fill="currentColor" /> {r.streak}d</span>
              <span className="font-mono text-sm font-semibold w-20 text-right">{r.xp.toLocaleString()}</span>
            </motion.div>
          );
        })}
      </div>
      {data.meRank === null && <p className="text-muted text-sm mt-4">Instructors and admins aren&apos;t ranked — only XP-bearing student accounts appear.</p>}
    </div>
  );
}
