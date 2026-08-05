import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../../generated/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database health check failed", error);
      return false;
    }
  }
}
