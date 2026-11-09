"use client";
import { Activity, BarChart3, Flame, GraduationCap } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { ActivityArea, Radar } from "@/components/Charts";
import { CountUp, PageHeader, Ring, SectionTitle, SkillBar, StatCard } from "@/components/ui";
import { useApi } from "@/lib/hooks";

type Analytics = {
  xp: number; level: number; nextLevelXp: number;
  streak: { current: number; longest: number };
  mastery: { skill: string; score: number }[];
  lessonsDone: number; minutesSpent: number; runs: number; badgesCount: number; reviewsGiven: number;
  path: { done: number; total: number }; velocity: number;
  activity: { date: string; lessons: number; runs: number }[];
};

export default function ProgressPage() {
  const { data, loading, error } = useApi<Analytics>("/api/v1/analytics/student");
  if (loading) return <SphereLoader label="Computing your analytics" />;
  if (!data) return <p className="text-muted">{error ?? "No data."}</p>;

  const pctToNext = Math.min(100, Math.round((data.xp / data.nextLevelXp) * 100));
  const sorted = [...data.mastery].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <PageHeader title="Progress & analytics" sub="Every number here is computed from your records at request time — nothing is estimated." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Level" value={<CountUp value={data.level} />} sub={`${pctToNext}% toward level ${data.level + 1} · ${data.xp.toLocaleString()} XP`}>
          <div className="mt-3 h-1.5 rounded-full bg-raised overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pctToNext}%` }} />
          </div>
        </StatCard>
        <StatCard label="Current streak" accent="var(--amber)" value={<span className="flex items-center gap-2"><Flame size={22} className="text-amber" fill="currentColor" /><CountUp value={data.streak.current} suffix="d" /></span>} sub={`best ${data.streak.longest} days`} />
        <StatCard label="Learning velocity" accent="var(--mint)" value={<CountUp value={Math.round(data.velocity * 100) / 100} />} sub="lessons/day, 14-day average" />
        <StatCard label="Time invested" accent="var(--coral)" value={<CountUp value={data.minutesSpent} suffix="m" />} sub={`${data.lessonsDone} lessons · ${data.runs} code runs`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <SectionTitle title="Activity, last 28 days" sub="Lessons finished + sandbox runs" right={<Activity size={15} className="text-muted" />} />
          <ActivityArea data={data.activity} />
          <div className="flex gap-4 mt-2 text-[11px] font-mono text-muted">
            <span>{data.activity.reduce((a, d) => a + d.lessons, 0)} lessons</span>
            <span>{data.activity.reduce((a, d) => a + d.runs, 0)} runs</span>
            <span className="ml-auto">{data.activity.filter((d) => d.lessons + d.runs > 0).length} active days</span>
          </div>
        </div>
        <div className="card p-6">
          <SectionTitle title="Path completion" sub={data.path.total ? `${data.path.done} of ${data.path.total} lessons done` : "no active path"} right={<GraduationCap size={15} className="text-muted" />} />
          <div className="flex items-center gap-6">
            <Ring value={data.path.total ? (data.path.done / data.path.total) * 100 : 0} size={130} stroke={10} color="var(--mint)"
              label={<p className="display text-3xl font-extrabold">{data.path.total ? Math.round((data.path.done / data.path.total) * 100) : 0}%</p>} />
            <div className="text-sm text-muted space-y-2">
              <p>Complete every item and the system issues a certificate with a public verify code.</p>
              <p className="font-mono text-xs">reviews given: {data.reviewsGiven}</p>
              <p className="font-mono text-xs">badges: {data.badgesCount}/8</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <SectionTitle title="Mastery constellation" right={<BarChart3 size={15} className="text-muted" />} />
          {data.mastery.length >= 3 ? <Radar data={data.mastery} /> : <p className="text-muted text-sm py-8 text-center">Take the placement to chart your skills.</p>}
        </div>
        <div className="card p-6">
          <SectionTitle title="Per-skill mastery" sub="Latest measurement wins" />
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {sorted.length === 0 && <p className="text-muted text-sm">No measurements yet.</p>}
            {sorted.map((m) => (
              <SkillBar key={m.skill} name={m.skill} value={m.score}
                color={m.score < 40 ? "var(--coral)" : m.score < 70 ? "var(--amber)" : "var(--primary)"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
