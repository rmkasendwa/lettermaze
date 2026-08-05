import { Injectable } from "@nestjs/common";
import {
  healthResponseSchema,
  type HealthResponse,
} from "@lettermaze/contracts";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const healthy = await this.prisma.isHealthy();
    return healthResponseSchema.parse(
      healthy
        ? { status: "ok", database: "connected" }
        : { status: "error", database: "disconnected" },
    );
  }
}
