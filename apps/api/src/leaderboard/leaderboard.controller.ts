import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { scoreSubmissionSchema, type Leaderboard } from "@lettermaze/contracts";
import { LeaderboardService } from "./leaderboard.service";

@Controller("leaderboards")
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get(":puzzleId")
  get(@Param("puzzleId") puzzleId: string): Promise<Leaderboard> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzleId)) throw new BadRequestException("Invalid puzzle id.");
    return this.leaderboard.get(puzzleId);
  }

  @Post()
  async submit(@Body() body: unknown): Promise<{ accepted: true }> {
    const parsed = scoreSubmissionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid score submission.");
    try {
      await this.leaderboard.submit(parsed.data);
      return { accepted: true };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new ConflictException("This player's ranked attempt was already submitted.");
      }
      throw error;
    }
  }
}
