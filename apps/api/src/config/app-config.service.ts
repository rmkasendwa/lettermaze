import { Injectable } from "@nestjs/common";
import { z } from "zod";

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

@Injectable()
export class AppConfigService {
  private readonly environment = environmentSchema.parse(process.env);

  readonly apiPort = this.environment.API_PORT;
  readonly databaseUrl = this.environment.DATABASE_URL;
  readonly nodeEnv = this.environment.NODE_ENV;
  readonly corsOrigins = this.environment.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
