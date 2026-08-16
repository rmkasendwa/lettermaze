export type AchievementMetric =
  "highestScore" | "longestWord" | "gamesPlayed" | "longestStreak";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "score-100",
    name: "Triple Digits",
    description: "Score at least 100 points in one game.",
    metric: "highestScore",
    threshold: 100,
  },
  {
    id: "score-500",
    name: "High Flyer",
    description: "Score at least 500 points in one game.",
    metric: "highestScore",
    threshold: 500,
  },
  {
    id: "word-6",
    name: "Long Shot",
    description: "Find a word with at least 6 letters.",
    metric: "longestWord",
    threshold: 6,
  },
  {
    id: "word-8",
    name: "Wordsmith",
    description: "Find a word with at least 8 letters.",
    metric: "longestWord",
    threshold: 8,
  },
  {
    id: "games-1",
    name: "First Steps",
    description: "Complete your first game.",
    metric: "gamesPlayed",
    threshold: 1,
  },
  {
    id: "games-10",
    name: "Getting Serious",
    description: "Complete 10 games.",
    metric: "gamesPlayed",
    threshold: 10,
  },
  {
    id: "games-50",
    name: "Maze Veteran",
    description: "Complete 50 games.",
    metric: "gamesPlayed",
    threshold: 50,
  },
  {
    id: "streak-3",
    name: "On a Roll",
    description: "Reach a 3-day daily challenge streak.",
    metric: "longestStreak",
    threshold: 3,
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Reach a 7-day daily challenge streak.",
    metric: "longestStreak",
    threshold: 7,
  },
] as const;

export interface AchievementProgress {
  highestScore: number;
  longestWord: number;
  gamesPlayed: number;
  longestStreak: number;
}

export function eligibleAchievementIds(progress: AchievementProgress) {
  return ACHIEVEMENTS.filter(
    (achievement) => progress[achievement.metric] >= achievement.threshold,
  ).map((achievement) => achievement.id);
}
