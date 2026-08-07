CREATE TABLE "DailyScore" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "wordsFound" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DailyScore_puzzleId_playerId_key" ON "DailyScore"("puzzleId", "playerId");
CREATE INDEX "DailyScore_puzzleId_score_idx" ON "DailyScore"("puzzleId", "score");
