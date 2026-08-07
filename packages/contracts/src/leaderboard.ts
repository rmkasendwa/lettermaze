import { z } from "zod";

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerLabel: z.string().min(1),
  score: z.number().int().nonnegative(),
  wordsFound: z.number().int().nonnegative(),
  submittedAt: z.string().datetime(),
});

export const leaderboardSchema = z.object({
  puzzleId: z.string(),
  totalPlayers: z.number().int().nonnegative(),
  entries: z.array(leaderboardEntrySchema),
  currentPlayer: leaderboardEntrySchema.nullable(),
});

export const scoreSubmissionSchema = z.object({
  puzzleId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  playerId: z.string().min(16).max(100),
  score: z.number().int().nonnegative(),
  wordsFound: z.number().int().nonnegative(),
});

export type Leaderboard = z.infer<typeof leaderboardSchema>;
export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;
