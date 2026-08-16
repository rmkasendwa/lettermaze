ALTER TABLE "PlayerStatistics"
ADD COLUMN "mostWordsFound" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "bestDailyScore" INTEGER NOT NULL DEFAULT 0;

UPDATE "PlayerStatistics" AS stats
SET "mostWordsFound" = games."mostWordsFound",
    "bestDailyScore" = games."bestDailyScore"
FROM (
  SELECT "userId",
         COALESCE(MAX("wordsFound"), 0) AS "mostWordsFound",
         COALESCE(MAX("score") FILTER (WHERE "isDaily"), 0) AS "bestDailyScore"
  FROM "CompletedGame"
  GROUP BY "userId"
) AS games
WHERE stats."userId" = games."userId";
