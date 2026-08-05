import Link from "next/link";
import { routes } from "@/lib/routes";
import { ThemeSelector } from "@/features/settings";
import { AppNavigation } from "./AppNavigation";
import { PageContainer } from "./PageContainer";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <PageContainer className="flex flex-wrap items-center justify-between gap-2 py-3">
        <Link
          href={routes.home}
          className="rounded font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
        >
          LetterMaze
        </Link>
        <AppNavigation />
        <ThemeSelector compact />
      </PageContainer>
    </header>
  );
}
