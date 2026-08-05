import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { HealthController } from "../src/health/health.controller";
import { HealthService } from "../src/health/health.service";
import type { PrismaService } from "../src/database/prisma.service";

function setup(databaseHealthy: boolean) {
  const prisma = {
    isHealthy: vi.fn().mockResolvedValue(databaseHealthy),
  } as unknown as PrismaService;
  const service = new HealthService(prisma);
  const controller = new HealthController(service);
  const status = vi.fn();
  const response = { status } as unknown as Response;
  return { controller, response, status };
}

describe("HealthController", () => {
  it("returns 200 when the database is connected", async () => {
    const { controller, response, status } = setup(true);
    await expect(controller.getHealth(response)).resolves.toEqual({
      status: "ok",
      database: "connected",
    });
    expect(status).toHaveBeenCalledWith(200);
  });

  it("returns 503 when the database is unavailable", async () => {
    const { controller, response, status } = setup(false);
    await expect(controller.getHealth(response)).resolves.toEqual({
      status: "error",
      database: "disconnected",
    });
    expect(status).toHaveBeenCalledWith(503);
  });
});
