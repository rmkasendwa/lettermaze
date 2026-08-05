import { clientEnv } from "@/lib/env/client";

export const appConfig = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  description:
    "Find words, build streaks, and challenge yourself with LetterMaze.",
  url: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
} as const;
