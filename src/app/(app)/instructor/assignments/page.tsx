"use client";
import { useState } from "react";
import { CalendarClock, ClipboardList, Plus, Users } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui";
import { SphereLoader } from "@/components/Logo";
import { toast } from "@/components/Toasts";
import { useRequireAuth } from "@/components/Shell";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

type Course = { id: string; title: string };
type Assignment = {
  id: string; courseId: string; course: string; title: string; instructions: string;
  dueAt: string | null; published: boolean; createdAt: string;
  studentCount: number; submittedCount: number; completedCount: number;
  averageScore: number | string | null;
};
type ClassroomData = { courses: Course[]; assignments: Assignment[] };
type Attempt = {
  id: string; student: string; score: string | number; passedCount: number; totalCount: number;
  isLate: boolean; submittedAt: string; code: string;
};

const exampleCases = JSON.stringify([
  { input: { value: 2 }, expected: 4, hidden: false },
  { input: { value: 9 }, expected: 18, hidden: true },
], null, 2);

export default function InstructorAssignmentsPage() {
  const { ready } = useRequireAuth("instructor");
  const data = useApi<ClassroomData>(ready ? "/api/v1/coding-assignments" : null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [starterCode, setStarterCode] = useState("function solve(input) {\n  // Return the expected result.\n}\n");
  const [dueAt, setDueAt] = useState("");
  const [testCases, setTestCases] = useState(exampleCases);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [attemptErrors, setAttemptErrors] = useState<Record<string, string>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<string | null>(null);
  const selectedCourseId = courseId || data.data?.courses[0]?.id || "";

  const createAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let parsedCases: unknown;
    try {
      parsedCases = JSON.parse(testCases);
    } catch {
      toast.err("Test cases must be valid JSON.");
      return;
    }
    setSaving(true);
    const result = await api.post<{ id: string }>("/api/v1/coding-assignments", {
      courseId: selectedCourseId,
      title,
      prompt,
      instructions,
      starterCode,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      published,
      testCases: parsedCases,
    });
    setSaving(false);
    if (!result.success) {
      toast.err(result.message);
      return;
    }
    toast.ok(result.message);
    setTitle("");
    setPrompt("");
    setInstructions("");
    setDueAt("");
    void data.refetch();
  };

  const togglePublished = async (assignment: Assignment) => {
    const result = await api.patch(`/api/v1/coding-assignments/${assignment.id}`, { published: !assignment.published });
    if (!result.success) {
      toast.err(result.message);
      return;
    }
    toast.ok(result.message);
    void data.refetch();
  };
  const loadAttempts = async (assignmentId: string) => {
    if (attempts[assignmentId]) {
      setAttempts((current) => {
        const next = { ...current };
        delete next[assignmentId];
        return next;
      });
      return;
    }
    setLoadingAttempts(assignmentId);
    const result = await api.get<Attempt[]>(`/api/v1/coding-assignments/${assignmentId}/attempts`);
    setLoadingAttempts(null);
    if (!result.success) {
      setAttemptErrors((current) => ({ ...current, [assignmentId]: result.message }));
      return;
    }
    setAttemptErrors((current) => ({ ...current, [assignmentId]: "" }));
    setAttempts((current) => ({ ...current, [assignmentId]: result.data }));
  };

  if (!ready || data.loading) return <SphereLoader label="Loading assignment tools" />;

  return (
    <div className="space-y-8">
      <PageHeader title="Coding assignments" sub="Create auto-graded JavaScript work for your courses, add private tests, set due dates, and review class progress." />

      {data.error && (
        <div className="card p-4 flex items-center justify-between gap-4">
          <p className="text-coral text-sm">{data.error}</p>
          <button onClick={() => void data.refetch()} className="btn btn-ghost !py-1.5">Retry</button>
        </div>
      )}

      <section className="card p-5 md:p-7">
        <SectionTitle title="Create an assignment" sub="Students see visible tests; private tests run on the server and are never sent to their browser." right={<Plus size={16} className="text-primary" />} />
        {data.data?.courses.length === 0 ? (
          <p className="text-muted text-sm mt-5">You don&apos;t own a course yet. Ask an administrator to assign a course to your instructor account.</p>
        ) : (
          <form onSubmit={createAssignment} className="mt-5 grid md:grid-cols-2 gap-4">
            <label className="text-sm font-medium">Course
              <select className="input mt-1.5" value={courseId || data.data?.courses[0]?.id || ""} onChange={(event) => setCourseId(event.target.value)} required>
                {data.data?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Assignment title
              <input className="input mt-1.5" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Array transformations" minLength={3} maxLength={160} required />
            </label>
            <label className="text-sm font-medium md:col-span-2">Problem prompt
              <textarea className="input mt-1.5 min-h-28 resize-y" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the problem and the function students should implement." minLength={10} maxLength={10000} required />
            </label>
            <label className="text-sm font-medium md:col-span-2">Additional instructions <span className="text-muted font-normal">(optional)</span>
              <textarea className="input mt-1.5 min-h-20 resize-y" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Constraints, hints, or submission guidance." maxLength={10000} />
            </label>
            <label className="text-sm font-medium md:col-span-2">Starter code
              <textarea className="input mt-1.5 min-h-36 resize-y font-mono text-xs" value={starterCode} onChange={(event) => setStarterCode(event.target.value)} maxLength={50000} />
            </label>
            <label className="text-sm font-medium md:col-span-2">Test cases <span className="text-muted font-normal">JSON array, with at least one visible case</span>
              <textarea className="input mt-1.5 min-h-48 resize-y font-mono text-xs" value={testCases} onChange={(event) => setTestCases(event.target.value)} spellCheck={false} required />
            </label>
            <label className="text-sm font-medium">Due date <span className="text-muted font-normal">(optional)</span>
              <input type="datetime-local" className="input mt-1.5" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
              Publish immediately
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button className="btn btn-primary" disabled={saving || !data.data?.courses.length}>
                {saving ? "Saving…" : <><ClipboardList size={14} /> {published ? "Create and publish" : "Save draft"}</>}
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <SectionTitle title="Assignment progress" sub="Completion means all test cases pass at least once. Students can resubmit; the best score is retained in their history." right={<Users size={16} className="text-muted" />} />
        {!data.data?.assignments.length ? (
          <div className="card p-6 text-muted text-sm">No assignments created yet.</div>
        ) : (
          <div className="space-y-3 mt-4">
            {data.data.assignments.map((assignment) => (
              <article key={assignment.id} className="card p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="display font-bold">{assignment.title}</h2>
                      <span className={`tag ${assignment.published ? "!text-mint !border-mint/40" : "!text-amber !border-amber/40"}`}>{assignment.published ? "published" : "draft"}</span>
                    </div>
                    <p className="text-muted text-xs mt-1">{assignment.course}</p>
                    <p className="text-muted text-sm mt-2">{assignment.instructions || "No additional instructions."}</p>
                  </div>
                  <button onClick={() => void togglePublished(assignment)} className="btn btn-ghost !py-1.5 text-xs">
                    {assignment.published ? "Unpublish" : "Publish"}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono text-muted">
                  <span className="inline-flex items-center gap-1.5"><CalendarClock size={13} />{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleString()}` : "No due date"}</span>
                  <span>{assignment.completedCount}/{assignment.studentCount} students passed all tests</span>
                  <span>{assignment.submittedCount} submissions</span>
                  <span>Class average {assignment.averageScore === null ? "—" : `${Number(assignment.averageScore)}%`}</span>
                </div>
                <button type="button" className="btn btn-ghost !py-1.5 text-xs mt-3" onClick={() => void loadAttempts(assignment.id)} disabled={loadingAttempts === assignment.id}>
                  {loadingAttempts === assignment.id ? "Loading submitted code…" : attempts[assignment.id] ? "Hide submitted code" : "Review submitted code"}
                </button>
                {attemptErrors[assignment.id] && <p role="alert" className="text-coral text-xs mt-2">{attemptErrors[assignment.id]}</p>}
                {attempts[assignment.id] && (
                  <div className="mt-3 space-y-3">
                    {!attempts[assignment.id].length && <p className="text-sm text-muted">No submissions yet.</p>}
                    {attempts[assignment.id].map((attempt) => (
                      <details key={attempt.id} className="rounded-lg border border-line p-3">
                        <summary className="cursor-pointer text-sm">
                          {attempt.student} · {Number(attempt.score)}% · {attempt.passedCount}/{attempt.totalCount} tests
                          {attempt.isLate ? " · late" : ""} · {new Date(attempt.submittedAt).toLocaleString()}
                        </summary>
                        <pre className="monaco-wrap mt-3 max-h-[480px] overflow-auto rounded-lg bg-[#0d1024] p-4 text-xs text-[#c9d1ff]"><code>{attempt.code}</code></pre>
                      </details>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
