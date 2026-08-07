import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { AccountModule } from "./account/account.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    LeaderboardModule,
    AccountModule,
  ],
})
export class AppModule {}
