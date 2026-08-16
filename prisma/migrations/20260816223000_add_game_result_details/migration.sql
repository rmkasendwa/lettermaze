ALTER TABLE "CompletedGame"
ADD COLUMN "words" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "boardSize" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN "durationSeconds" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "CompletedGame_userId_completedAt_idx";
CREATE INDEX "CompletedGame_userId_completedAt_id_idx"
ON "CompletedGame"("userId", "completedAt", "id");
