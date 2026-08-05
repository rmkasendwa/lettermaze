"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const links = [
  { href: routes.play, label: "Play" },
  { href: routes.daily, label: "Daily" },
  { href: routes.settings, label: "Settings" },
];
export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-wrap items-center gap-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:hover:bg-slate-800",
                pathname === href &&
                  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
