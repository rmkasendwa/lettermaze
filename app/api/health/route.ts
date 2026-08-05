import { NextResponse } from "next/server";
import { isDatabaseHealthy } from "@/server/db/health";
import type { HealthResponse } from "@/types/api";
export async function GET(): Promise<NextResponse<HealthResponse>> {
  if (await isDatabaseHealthy())
    return NextResponse.json({ status: "ok", database: "connected" });
  return NextResponse.json(
    { status: "error", database: "disconnected" },
    { status: 503 },
  );
}
