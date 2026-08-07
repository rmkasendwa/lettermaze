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

  async get(puzzleId: string, playerId?: string): Promise<Leaderboard> {
    const orderBy = [
      { score: "desc" as const },
      { wordsFound: "desc" as const },
      { submittedAt: "asc" as const },
      { playerId: "asc" as const },
    ];
    const [scores, totalPlayers] = await Promise.all([
      this.prisma.dailyScore.findMany({
        where: { puzzleId },
        orderBy,
        take: 10,
        select: {
          playerId: true,
          score: true,
          wordsFound: true,
          submittedAt: true,
        },
      }),
      this.prisma.dailyScore.count({ where: { puzzleId } }),
    ]);

    const currentScore = playerId
      ? await this.prisma.dailyScore.findUnique({
          where: { puzzleId_playerId: { puzzleId, playerId } },
          select: {
            playerId: true,
            score: true,
            wordsFound: true,
            submittedAt: true,
          },
        })
      : null;

    const toEntry = (
      entry: {
        playerId: string;
        score: number;
        wordsFound: number;
        submittedAt: Date;
      },
      rank: number,
    ) => ({
      rank,
      playerLabel: `Player ${entry.playerId.slice(-6).toUpperCase()}`,
      score: entry.score,
      wordsFound: entry.wordsFound,
      submittedAt: entry.submittedAt.toISOString(),
    });

    let currentPlayer = null;
    if (currentScore) {
      const topIndex = scores.findIndex(
        (score) => score.playerId === currentScore.playerId,
      );
      if (topIndex >= 0) {
        currentPlayer = toEntry(currentScore, topIndex + 1);
      } else {
        const playersAhead = await this.prisma.dailyScore.count({
          where: {
            puzzleId,
            OR: [
              { score: { gt: currentScore.score } },
              {
                score: currentScore.score,
                wordsFound: { gt: currentScore.wordsFound },
              },
              {
                score: currentScore.score,
                wordsFound: currentScore.wordsFound,
                submittedAt: { lt: currentScore.submittedAt },
              },
              {
                score: currentScore.score,
                wordsFound: currentScore.wordsFound,
                submittedAt: currentScore.submittedAt,
                playerId: { lt: currentScore.playerId },
              },
            ],
          },
        });
        currentPlayer = toEntry(currentScore, playersAhead + 1);
      }
    }

    return {
      puzzleId,
      totalPlayers,
      entries: scores.map((entry, index) => toEntry(entry, index + 1)),
      currentPlayer,
    };
  }
}
