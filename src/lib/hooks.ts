"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

// Small data hook: fetch on mount, expose loading + refetch. Envelope errors surface as strings.
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const reqSeq = useRef(0);

  const refetch = useCallback(async () => {
    if (!path) return;
    const seq = ++reqSeq.current;
    setLoading(true);
    const res = await api.get<T>(path);
    if (seq !== reqSeq.current) return;
    setLoading(false);
    if (res.success) { setData(res.data); setError(null); }
    else setError(res.message);
  }, [path]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refetch(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refetch]);
  return { data, error, loading, refetch, setData };
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setM(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return m;
}

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const timeAgo = (d: string | Date) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
