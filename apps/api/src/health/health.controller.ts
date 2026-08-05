import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import type { HealthResponse } from "@lettermaze/contracts";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResponse> {
    const health = await this.healthService.check();
    response.status(
      health.status === "ok" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return health;
  }
}
