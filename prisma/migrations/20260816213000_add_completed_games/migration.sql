CREATE TABLE "CompletedGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "wordsFound" INTEGER NOT NULL,
    "longestWord" TEXT NOT NULL DEFAULT '',
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "puzzleId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedGame_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompletedGame_userId_completedAt_idx" ON "CompletedGame"("userId", "completedAt");
CREATE INDEX "CompletedGame_userId_isDaily_idx" ON "CompletedGame"("userId", "isDaily");

ALTER TABLE "CompletedGame" ADD CONSTRAINT "CompletedGame_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
