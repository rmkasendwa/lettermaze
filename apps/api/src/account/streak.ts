const DAY_MS = 86_400_000;

export interface DailyStreak {
  current: number;
  longest: number;
}

function dayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function calculateDailyStreak(
  completionDates: readonly string[],
  localToday: string,
): DailyStreak {
  const days = [...new Set(completionDates)]
    .map(dayNumber)
    .sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0 };

  let run = 1;
  let longest = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = days[index] === days[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const last = days.at(-1)!;
  const today = dayNumber(localToday);
  return { current: last >= today - 1 ? run : 0, longest };
}
