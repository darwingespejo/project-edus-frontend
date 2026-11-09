"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCheck, Info } from "lucide-react";

type Toast = { id: number; message: string; kind: "ok" | "err" | "info" };
type ToastState = { toasts: Toast[]; push: (message: string, kind?: Toast["kind"]) => void; drop: (id: number) => void };

let seq = 0;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = "info") => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
  drop: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  ok: (m: string) => useToasts.getState().push(m, "ok"),
  err: (m: string) => useToasts.getState().push(m, "err"),
  info: (m: string) => useToasts.getState().push(m, "info"),
};

const ICONS = { ok: CheckCheck, err: AlertTriangle, info: Info };
const COLORS = { ok: "var(--success)", err: "var(--error)", info: "var(--primary)" };

export function ToastHost() {
  const { toasts, drop } = useToasts();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={() => drop(t.id)}
              className="card-raise flex items-center gap-2.5 px-4 py-3 text-sm text-left max-w-sm shadow-xl cursor-pointer"
              style={{ borderLeft: `3px solid ${COLORS[t.kind]}` }}
            >
              <Icon size={16} style={{ color: COLORS[t.kind] }} className="shrink-0" />
              <span>{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
