import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { PageContainer } from "./PageContainer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:absolute focus:left-3 focus:top-3 dark:bg-slate-900"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content" className="flex-1 py-10">
        <PageContainer>{children}</PageContainer>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        LetterMaze foundation
      </footer>
    </div>
  );
}
