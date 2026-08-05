"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium">
      <span>{compact ? "Theme" : "Color theme"}</span>
      <select
        aria-label="Color theme"
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        value={mounted ? theme : "system"}
        onChange={(event) => setTheme(event.target.value)}
        disabled={!mounted}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
