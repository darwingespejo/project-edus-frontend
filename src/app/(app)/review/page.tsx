"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, FileCode2, PenLine, Send, UserRoundX } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { PageHeader, EmptyState } from "@/components/ui";
import { BadgeModal, type EarnedBadge } from "@/components/BadgeModal";
import { toast } from "@/components/Toasts";
import { timeAgo, useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store";

type Rubric = { title: string; criteria: { id: string; label: string; description: string; maxPoints: number }[] } | null;
type QueueItem = {
  assignmentId: string; status: "pending" | "submitted"; assignedAt: string; submittedAt: string;
  authorAlias: string; title: string; prompt: string | null; code: string; language: string; rubric: Rubric;
};
type SubmitResp = { xp: number; level: number; badges: (EarnedBadge | null)[] };

export default function ReviewPage() {
  const { setUser } = useAuth();
  const queue = useApi<QueueItem[]>("/api/v1/peer-review/queue");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const items = queue.data ?? [];
  const pending = items.filter((i) => i.status === "pending");
  const active = items.find((i) => i.assignmentId === activeId) ?? null;

  const select = (item: QueueItem) => {
    setActiveId(item.assignmentId);
    setShowPreview(false);
    setComment("");
    const init: Record<string, number> = {};
    item.rubric?.criteria.forEach((c) => (init[c.id] = c.maxPoints));
    setScores(init);
  };

  const total = useMemo(
    () => (active?.rubric?.criteria ?? []).reduce((a, c) => a + (scores[c.id] ?? 0), 0),
    [scores, active]
  );
  const maxTotal = useMemo(
    () => (active?.rubric?.criteria ?? []).reduce((a, c) => a + c.maxPoints, 0),
    [active]
  );

  const submit = async () => {
    if (!active?.rubric) return;
    setBusy(true);
    const res = await api.post<SubmitResp>("/api/v1/peer-review/submit", {
      assignmentId: active.assignmentId,
      comment,
      scores: active.rubric.criteria.map((c) => ({ criterionId: c.id, score: scores[c.id] ?? 0 })),
    });
    setBusy(false);
    if (!res.success) { toast.err(res.message); return; }
    toast.ok("Review submitted. +50 XP.");
    const earned = (res.data.badges ?? []).filter(Boolean) as EarnedBadge[];
    if (earned.length) setBadges(earned);
    const me = await api.get<{ user: Parameters<typeof setUser>[0] }>("/api/v1/auth/me");
    if (me.success) setUser(me.data.user);
    setActiveId(null);
    void queue.refetch();
  };

  if (queue.loading) return <SphereLoader label="Loading review queue" />;

  return (
    <div>
      {badges.length > 0 && <BadgeModal badges={badges} onClose={() => setBadges(badges.slice(1))} />}
      <PageHeader title="Peer review queue" sub="Submissions arrive anonymously — you see an alias, never a name. Score every rubric line and write feedback worth acting on; your own submissions go through the same door." />

      {pending.length === 0 ? (
        <EmptyState
          icon={<UserRoundX size={20} />}
          title="Queue is clear"
          body="New submissions land here automatically the moment a classmate submits an assignment. The assigner never sends twice and never sends your own work."
        />
      ) : !active ? (
        <div className="grid md:grid-cols-2 gap-4">
          {pending.map((i, idx) => (
            <motion.button key={i.assignmentId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
              onClick={() => select(i)} className="card p-6 text-left hover:border-primary/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="tag !text-primary !border-primary/40">{i.authorAlias}</span>
                <span className="font-mono text-[11px] text-muted">assigned {timeAgo(i.assignedAt)}</span>
              </div>
              <h3 className="display font-bold text-lg mt-4 group-hover:text-primary transition-colors">{i.title}</h3>
              <p className="text-muted text-sm mt-1.5 line-clamp-2">{i.prompt ?? "Assignment submission"}</p>
              <div className="flex items-center gap-2 mt-5 text-[13px] font-medium text-primary">
                <PenLine size={14} /> Start reviewing · {i.rubric?.criteria.length ?? 0} criteria
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="grid xl:grid-cols-[1fr_380px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="tag !text-primary !border-primary/40">{active.authorAlias}</span>
                <h3 className="display font-bold text-xl mt-2">{active.title}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(false)} className={`btn !py-1.5 text-[13px] ${!showPreview ? "btn-primary" : "btn-ghost"}`}><FileCode2 size={13} /> Code</button>
                {active.language === "html" && (
                  <button onClick={() => setShowPreview(true)} className={`btn !py-1.5 text-[13px] ${showPreview ? "btn-primary" : "btn-ghost"}`}><Eye size={13} /> Live view</button>
                )}
                <button onClick={() => setActiveId(null)} className="btn btn-ghost !py-1.5 text-[13px]">Back to queue</button>
              </div>
            </div>
            {showPreview && active.language === "html" ? (
              <div className="monaco-wrap bg-white">
                <iframe title="Submission preview" sandbox="allow-scripts" srcDoc={active.code} className="w-full h-[480px]" />
              </div>
            ) : (
              <div className="monaco-wrap bg-[#0d1024]">
                <pre className="p-5 overflow-auto max-h-[480px] font-mono text-[13px] leading-relaxed text-[#c9d1ff]">{active.code}</pre>
              </div>
            )}
          </div>

          <div className="card p-6 xl:sticky xl:top-24">
            <div className="flex items-center justify-between mb-1">
              <h4 className="display font-bold">{active.rubric?.title ?? "Rubric"}</h4>
              <motion.p key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-mono text-lg">
                <span className="text-primary font-bold">{total}</span><span className="text-muted text-sm">/{maxTotal}</span>
              </motion.p>
            </div>
            <p className="text-muted text-xs mb-5">Slide to score. The total updates live.</p>
            <div className="space-y-5">
              {active.rubric?.criteria.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="font-mono text-sm"><span className="text-primary">{scores[c.id] ?? 0}</span><span className="text-muted">/{c.maxPoints}</span></p>
                  </div>
                  <p className="text-muted text-xs mt-0.5">{c.description}</p>
                  <input type="range" min={0} max={c.maxPoints} step={1} value={scores[c.id] ?? 0}
                    aria-label={`Score for ${c.label}`}
                    onChange={(e) => setScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))}
                    className="rubric-range mt-2" />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <label className="text-sm font-medium block mb-1.5">Written feedback</label>
              <textarea className="input min-h-[110px] resize-y" placeholder="What works, what doesn't, and the one change that matters most. 20 characters minimum."
                value={comment} onChange={(e) => setComment(e.target.value)} />
              <p className={`text-xs mt-1 font-mono ${comment.trim().length >= 20 ? "text-mint" : "text-muted"}`}>{comment.trim().length}/20 min</p>
            </div>
            <button className="btn btn-primary w-full mt-5" onClick={submit} disabled={busy || comment.trim().length < 20}>
              {busy ? "Submitting…" : <><Send size={14} /> Submit review · +50 XP</>}
            </button>
            <AnimatePresence>
              {comment.trim().length > 0 && comment.trim().length < 20 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-coral text-xs mt-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {20 - comment.trim().length} more characters to go
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
