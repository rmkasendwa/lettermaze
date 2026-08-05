import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { appConfig } from "@/lib/appConfig";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: appConfig.url,
  title: { default: appConfig.name, template: `%s | ${appConfig.name}` },
  description: appConfig.description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: appConfig.url,
    siteName: appConfig.name,
    title: appConfig.name,
    description: appConfig.description,
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
