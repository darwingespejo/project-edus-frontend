"use client";
import { motion } from "framer-motion";
import { BookOpen, ClipboardCheck, Flame } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { CountUp, PageHeader, SectionTitle, SkillBar, EmptyState } from "@/components/ui";
import { timeAgo, useApi } from "@/lib/hooks";
import { useRequireAuth } from "@/components/Shell";

type Instructor = {
  students: { id: string; name: string; xp: number; level: number; lessons: number; reviewsDone: number; reviewsPending: number; streak: number; avgMastery: number | null }[];
  classMastery: { skill: string; avgScore: number }[];
  reviewQueue: { status: string; count: number }[];
};
type Submission = {
  id: string; title: string | null; exercise: string | null; code: string; language: string; author: string; authorAlias: string;
  status: string; createdAt: string; reviewers: number; reviewsDone: number; avgScore: number | null;
};

export default function InstructorPage() {
  const { ready } = useRequireAuth("instructor");
  const an = useApi<Instructor>(ready ? "/api/v1/analytics/instructor" : null);
  const subs = useApi<Submission[]>(ready ? "/api/v1/submissions" : null);

  if (!ready || an.loading || subs.loading) return <SphereLoader label="Loading classroom" />;
  if (!an.data) return <p className="text-muted">{an.error ?? "No data."}</p>;

  const d = an.data;
  const assignments = (subs.data ?? []).filter((s) => s.title || s.exercise);
  const pendingReviews = d.students.reduce((a, s) => a + s.reviewsPending, 0);
  const classAvgXp = Math.round(d.students.reduce((a, s) => a + s.xp, 0) / Math.max(1, d.students.length));
  const mastery = [...d.classMastery].sort((a, b) => a.avgScore - b.avgScore);

  return (
    <div className="space-y-8">
      <PageHeader title="Classroom overview" sub="Aggregates recompute on every load from progress, score, and review records. Students see only their own numbers." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-5"><p className="eyebrow">Students</p><p className="display text-3xl font-bold mt-2"><CountUp value={d.students.length} /></p></div>
        <div className="card p-5"><p className="eyebrow">Avg class XP</p><p className="display text-3xl font-bold mt-2"><CountUp value={classAvgXp} /></p></div>
        <div className="card p-5"><p className="eyebrow">Reviews outstanding</p><p className="display text-3xl font-bold mt-2"><CountUp value={pendingReviews} /></p></div>
        <div className="card p-5"><p className="eyebrow">Assignments</p><p className="display text-3xl font-bold mt-2"><CountUp value={d.reviewQueue.reduce((a, r) => a + Number(r.count), 0)} /></p></div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="card p-6 lg:col-span-3 overflow-x-auto">
          <SectionTitle title="Students" sub="Sorted by XP · mastery = latest score per skill, averaged" />
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-muted text-[11px] font-mono border-b border-line">
                <th className="pb-2.5 font-normal">Student</th>
                <th className="pb-2.5 font-normal">XP</th>
                <th className="pb-2.5 font-normal">Mastery</th>
                <th className="pb-2.5 font-normal">Lessons</th>
                <th className="pb-2.5 font-normal">Streak</th>
                <th className="pb-2.5 font-normal">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {d.students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-line/50 last:border-0">
                  <td className="py-2.5 font-medium">{s.name}</td>
                  <td className="py-2.5 font-mono">{s.xp.toLocaleString()}</td>
                  <td className="py-2.5 font-mono">{s.avgMastery !== null ? `${s.avgMastery}%` : "—"}</td>
                  <td className="py-2.5 font-mono">{s.lessons}</td>
                  <td className="py-2.5 font-mono"><span className="flex items-center gap-1 text-amber"><Flame size={11} fill="currentColor" />{s.streak}d</span></td>
                  <td className="py-2.5 font-mono"><span className={s.reviewsPending > 0 ? "text-amber" : "text-mint"}>{s.reviewsDone} done{s.reviewsPending > 0 ? ` · ${s.reviewsPending} due` : ""}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-6 lg:col-span-2">
          <SectionTitle title="Class gaps" sub="Weakest average skills across all students" />
          <div className="space-y-4">
            {mastery.slice(0, 6).map((m) => (
              <SkillBar key={m.skill} name={m.skill} value={m.avgScore}
                color={m.avgScore < 50 ? "var(--coral)" : "var(--primary)"} />
            ))}
            {mastery.length === 0 && <p className="text-muted text-sm">No measurements yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <SectionTitle title="Assignment pipeline" sub="Every submission, newest first · author aliases shown to match what students see" right={<ClipboardCheck size={15} className="text-muted" />} />
        {assignments.length === 0 ? (
          <EmptyState icon={<BookOpen size={20} />} title="No submissions yet" body="Once students submit the Orbit Loader assignment from the playground, they show up here with review status." />
        ) : (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-left text-muted text-[11px] font-mono border-b border-line">
                  <th className="px-5 py-3 font-normal">Submission</th>
                  <th className="px-3 py-3 font-normal">Author</th>
                  <th className="px-3 py-3 font-normal">Reviews</th>
                  <th className="px-3 py-3 font-normal">Avg score</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal">Age</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((s) => (
                  <tr key={s.id} className="border-b border-line/50 last:border-0">
                    <td className="px-5 py-3 font-medium">
                      <span className="block">{s.title ?? s.exercise}</span>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-primary">View exact submitted source</summary>
                        <pre className="monaco-wrap mt-2 max-h-80 overflow-auto rounded-lg bg-[#0d1024] p-3 text-xs text-[#c9d1ff]"><code>{s.code}</code></pre>
                      </details>
                    </td>
                    <td className="px-3 py-3"><span className="block">{s.author}</span><span className="font-mono text-[10px] text-muted">{s.authorAlias}</span></td>
                    <td className="px-3 py-3 font-mono">{s.reviewsDone}/{s.reviewers}</td>
                    <td className="px-3 py-3 font-mono">{s.avgScore !== null ? `${s.avgScore}/10` : "—"}</td>
                    <td className="px-3 py-3"><span className={`tag ${s.status === "reviewed" ? "!text-mint !border-mint/40" : "!text-amber !border-amber/40"}`}>{s.status}</span></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{timeAgo(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
