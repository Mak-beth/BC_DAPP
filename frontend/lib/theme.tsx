"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "nebula" | "aurora" | "obsidian";
const STORAGE_KEY = "sc-theme";
const LIST: ThemeName[] = ["nebula", "aurora", "obsidian"];
const LABELS: Record<ThemeName, string> = { nebula: "Nebula", aurora: "Aurora", obsidian: "Obsidian" };

interface Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  list: ThemeName[];
  labels: typeof LABELS;
}
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("nebula");

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null) as ThemeName | null;
    if (saved && LIST.includes(saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("theme-nebula", "theme-aurora", "theme-obsidian");
    if (theme !== "nebula") html.classList.add(`theme-${theme}`); // nebula is the default (no class = nebula vars)
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, list: LIST, labels: LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
