"use client";
import { create } from "zustand";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  xp: number;
  level: number;
  avatar?: string;
  bio?: string;
};

type AuthState = {
  user: User | null;
  access: string | null;
  refresh: string | null;
  hydrated: boolean;
  setAuth: (u: User, a: string, r: string) => void;
  setUser: (u: User) => void;
  clear: () => void;
};

const KEY = "edu-auth";

export function buildProfileAvatar(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ST";

  const palette = [
    ["#163d6b", "#71c7d7"],
    ["#0f766e", "#a7f3d0"],
    ["#7c3aed", "#f0abfc"],
    ["#b45309", "#fcd34d"],
    ["#be123c", "#fda4af"],
  ];
  const [from, to] = palette[Math.abs(initials.charCodeAt(0) + initials.length) % palette.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#g)"/>
      <circle cx="60" cy="47" r="19" fill="rgba(255,255,255,0.2)"/>
      <path d="M28 96c5-17 22-26 32-26s27 9 32 26" fill="rgba(255,255,255,0.2)"/>
      <text x="60" y="68" text-anchor="middle" font-size="30" font-weight="700" fill="#f9fbff" font-family="Arial, sans-serif">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const normalizeUser = (candidate: Partial<User> | null | undefined): User => ({
  id: candidate?.id ?? "",
  name: candidate?.name ?? "Student",
  email: candidate?.email ?? "",
  role: candidate?.role ?? "student",
  xp: candidate?.xp ?? 0,
  level: candidate?.level ?? 1,
  avatar: candidate?.avatar ?? buildProfileAvatar(candidate?.name ?? "Student"),
  bio: candidate?.bio ?? "Building momentum, one lesson at a time.",
});

export function getPostAuthPath(user: Pick<User, "role"> | null | undefined, opts: { isNew?: boolean } = {}) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "instructor") return "/instructor";
  return opts.isNew ? "/assessment" : "/dashboard";
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  access: null,
  refresh: null,
  hydrated: false,
  setAuth: (user, access, refresh) => {
    const nextUser = normalizeUser(user);
    localStorage.setItem(KEY, JSON.stringify({ user: nextUser, access, refresh }));
    set({ user: nextUser, access, refresh, hydrated: true });
  },
  setUser: (user) => {
    const nextUser = normalizeUser(user);
    const raw = localStorage.getItem(KEY);
    if (raw) localStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(raw), user: nextUser }));
    set({ user: nextUser });
  },
  clear: () => {
    localStorage.removeItem(KEY);
    set({ user: null, access: null, refresh: null, hydrated: true });
  },
}));

export function hydrateAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { user, access, refresh } = JSON.parse(raw);
      useAuth.setState({ user: normalizeUser(user), access, refresh, hydrated: true });
      return;
    }
  } catch {
    // corrupted storage — fall through to signed-out
  }
  useAuth.setState({ hydrated: true });
}
