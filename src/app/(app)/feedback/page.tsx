"use client";
import { motion } from "framer-motion";
import { MessageSquareText, Quote } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { timeAgo, useApi } from "@/lib/hooks";

type Feedback = {
  reviewId: string; reviewerAlias: string; title: string; comment: string; createdAt: string;
  total: number; max: number;
  criteria: { label: string; score: number; maxPoints: number }[];
};
type Submission = {
  id: string; kind: string; title: string | null; exercise: string | null;
  status: "submitted" | "reviewing" | "reviewed"; createdAt: string;
  reviewers: number; reviewsDone: number; avgScore: number | null;
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "!text-muted",
  reviewing: "!text-amber !border-amber/40",
  reviewed: "!text-mint !border-mint/40",
};

export default function FeedbackPage() {
  const feedback = useApi<Feedback[]>("/api/v1/peer-review/feedback");
  const subs = useApi<Submission[]>("/api/v1/submissions");

  if (feedback.loading || subs.loading) return <SphereLoader label="Collecting feedback" />;
  const rows = feedback.data ?? [];
  const mySubs = (subs.data ?? []).filter((s) => s.kind === "assignment");
  const avg = rows.length ? (rows.reduce((a, r) => a + r.total / r.max, 0) / rows.length) * 100 : 0;

  return (
    <div>
      <PageHeader title="Feedback received" sub="Reviews arrive with the reviewer anonymized. Averages update as each of the assigned reviews lands." />

      {mySubs.length > 0 && (
        <div className="mb-8">
          <SectionTitle title="My submissions" />
          <div className="space-y-2">
            {mySubs.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex flex-wrap items-center gap-3">
                <p className="font-medium text-sm flex-1 min-w-0 truncate">{s.title ?? s.exercise ?? "Submission"}</p>
                <span className="font-mono text-[11px] text-muted">{s.reviewsDone}/{s.reviewers} reviews in</span>
                {s.avgScore !== null && s.status === "reviewed" && <span className="font-mono text-[12px] text-mint">avg {s.avgScore}/10</span>}
                <span className={`tag ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                <span className="font-mono text-[11px] text-muted">{timeAgo(s.createdAt)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquareText size={20} />} title="No feedback yet"
          body="When a classmate finishes reviewing one of your submissions, their rubric scores and written comments show up here — without their name attached." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="card p-5"><p className="eyebrow">Reviews</p><p className="display text-3xl font-bold mt-2 font-mono">{rows.length}</p></div>
            <div className="card p-5"><p className="eyebrow">Avg rubric score</p><p className="display text-3xl font-bold mt-2 font-mono">{avg.toFixed(0)}%</p></div>
            <div className="card p-5 hidden md:block"><p className="eyebrow">Latest</p><p className="display text-3xl font-bold mt-2 font-mono">{rows[0].total}/{rows[0].max}</p></div>
          </div>
          <div className="space-y-4">
            {rows.map((r, i) => (
              <motion.div key={r.reviewId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="tag !text-primary !border-primary/40">{r.reviewerAlias}</span>
                    <span className="text-muted text-sm">on <span className="text-text">{r.title}</span></span>
                  </div>
                  <span className="font-mono text-sm"><span className="text-primary font-bold">{r.total}</span><span className="text-muted">/{r.max}</span></span>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {r.criteria.map((c) => (
                    <div key={c.label} className="card-raise px-3.5 py-2.5">
                      <p className="text-[11px] text-muted">{c.label}</p>
                      <p className="font-mono text-sm mt-1">{c.score}<span className="text-muted">/{c.maxPoints}</span></p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 rounded-xl bg-raised/50 border border-line p-4">
                  <Quote size={15} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed text-text/90">{r.comment}</p>
                </div>
                <p className="font-mono text-[11px] text-muted mt-3">{timeAgo(r.createdAt)}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
