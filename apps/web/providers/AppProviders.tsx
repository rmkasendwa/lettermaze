"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { AccountProvider } from "@/features/account";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AccountProvider>{children}</AccountProvider>
    </ThemeProvider>
  );
}
