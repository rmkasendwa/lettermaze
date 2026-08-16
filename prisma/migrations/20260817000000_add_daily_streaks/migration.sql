CREATE TABLE "DailyCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyCompletion_userId_localDate_key"
ON "DailyCompletion"("userId", "localDate");
CREATE INDEX "DailyCompletion_userId_localDate_idx"
ON "DailyCompletion"("userId", "localDate");
ALTER TABLE "DailyCompletion" ADD CONSTRAINT "DailyCompletion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
