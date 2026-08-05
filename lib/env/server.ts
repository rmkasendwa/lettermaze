import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const result = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!result.success) {
  throw new Error(
    `Invalid server environment variables: ${z.prettifyError(result.error)}`,
  );
}

export const serverEnv = result.data;
