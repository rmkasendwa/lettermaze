import { clientEnv } from "@/lib/env/client";
import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      `API request failed with status ${response.status}.`,
    );
  return schema.parse(await response.json());
}
