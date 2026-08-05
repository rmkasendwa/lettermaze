import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { resolve } from "node:path";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

try {
  process.loadEnvFile(resolve(process.cwd(), "../../.env"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  if (process.env.NODE_ENV !== "production") {
    process.loadEnvFile(resolve(process.cwd(), "../../.env.example"));
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.enableShutdownHooks();
  await app.listen(config.apiPort, "0.0.0.0");
}

void bootstrap();
