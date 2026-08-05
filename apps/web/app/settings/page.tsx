import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ThemeSelector } from "@/features/settings";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Choose how LetterMaze looks. Gameplay preferences will be added with the
        game.
      </p>
      <Card className="mt-6">
        <ThemeSelector />
      </Card>
    </div>
  );
}
