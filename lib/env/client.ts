import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("LetterMaze"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const result = schema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!result.success) {
  throw new Error(
    `Invalid public environment variables: ${z.prettifyError(result.error)}`,
  );
}

export const clientEnv = result.data;
