"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Plus, Radio, Video } from "lucide-react";
import { SphereLoader } from "@/components/Logo";
import { EmptyState, PageHeader } from "@/components/ui";
import { toast } from "@/components/Toasts";
import { fmtDateTime, useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store";

type Session = { id: string; title: string; startsAt: string; durationMin: number; joinUrl: string; course: string; host: string; live: boolean };
type Course = { id: string; title: string };

export default function SessionsPage() {
  const { user } = useAuth();
  const sessions = useApi<Session[]>("/api/v1/sessions");
  const courses = useApi<Course[]>("/api/v1/courses");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  const canHost = user?.role === "instructor" || user?.role === "admin";

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !startsAt) { toast.err("Pick a course and a start time."); return; }
    setBusy(true);
    const res = await api.post("/api/v1/sessions", { courseId, title, startsAt: new Date(startsAt).toISOString(), durationMin: 60 });
    setBusy(false);
    if (!res.success) { toast.err(res.message); return; }
    toast.ok("Session scheduled. Join link uses a Jitsi room — no account needed.");
    setShowForm(false); setTitle(""); setStartsAt("");
    void sessions.refetch();
  };

  return (
    <div>
      <PageHeader title="Live sessions"
        sub="Sessions open as Jitsi rooms — the join link works in any browser without an account. Upcoming sessions only; past ones drop off automatically."
        actions={canHost && <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Schedule</button>} />

      {canHost && showForm && (
        <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={create}
          className="card p-5 mb-6 grid sm:grid-cols-[1fr_220px_220px_auto] gap-3 items-end">
          <div>
            <label className="text-xs text-muted block mb-1">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Debugging clinic" required minLength={4} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Course</label>
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Pick…</option>
              {(courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Starts at</label>
            <input type="datetime-local" className="input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Create session"}</button>
        </motion.form>
      )}

      {sessions.loading ? <SphereLoader label="Loading sessions" /> : (sessions.data ?? []).length === 0 ? (
        <EmptyState icon={<Radio size={20} />} title="Nothing scheduled"
          body={canHost ? "Schedule the first session with the button above." : "When an instructor schedules a session it appears here with a join button."} />
      ) : (
        <div className="space-y-3">
          {(sessions.data ?? []).map((s, i) => {
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card p-5 flex flex-wrap items-center gap-4">
                <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${s.live ? "bg-coral/15 text-coral" : "bg-raised text-primary"}`}>
                  {s.live ? <Radio size={19} /> : <CalendarClock size={19} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.title}</p>
                  <p className="font-mono text-[11.5px] text-muted mt-0.5">{fmtDateTime(s.startsAt)} · {s.durationMin} min · {s.course} · hosted by {s.host}</p>
                </div>
                {s.live && <span className="tag !text-coral !border-coral/40 animate-pulse">live now</span>}
                <a href={s.joinUrl} target="_blank" rel="noreferrer" className="btn btn-primary !py-2 text-[13px] shrink-0">
                  <Video size={14} /> Join session
                </a>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
