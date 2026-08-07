import { BadRequestException, Injectable } from "@nestjs/common";
import type { Leaderboard, ScoreSubmission } from "@lettermaze/contracts";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(submission: ScoreSubmission): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    if (submission.puzzleId !== today) {
      throw new BadRequestException("Only today's UTC puzzle accepts scores.");
    }
    await this.prisma.dailyScore.create({ data: submission });
  }

  async get(puzzleId: string): Promise<Leaderboard> {
    const scores = await this.prisma.dailyScore.findMany({
      where: { puzzleId },
      orderBy: [{ score: "desc" }, { wordsFound: "desc" }, { submittedAt: "asc" }],
      take: 100,
      select: { score: true, wordsFound: true, submittedAt: true },
    });
    return {
      puzzleId,
      entries: scores.map((entry, index) => ({
        rank: index + 1,
        score: entry.score,
        wordsFound: entry.wordsFound,
        submittedAt: entry.submittedAt.toISOString(),
      })),
    };
  }
}
