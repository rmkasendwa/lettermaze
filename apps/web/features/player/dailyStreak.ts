import type { StorageAdapter } from "@/lib/storage";

export const DAILY_COMPLETION_DATES_KEY = "lettermaze.daily-completions.v1";
const DAY_MS = 86_400_000;

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumber(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function calculateDailyStreak(dates: readonly string[], today: string) {
  const days = [...new Set(dates)].map(dayNumber).sort((a, b) => a - b);
  if (!days.length) return { current: 0, longest: 0 };
  let run = 1;
  let longest = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = days[index] === days[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return {
    current: days.at(-1)! >= dayNumber(today) - 1 ? run : 0,
    longest,
  };
}

export function recordDailyCompletion(
  storage: StorageAdapter,
  localDate: string,
) {
  const stored = storage.get<unknown>(DAILY_COMPLETION_DATES_KEY);
  const dates = Array.isArray(stored)
    ? stored.filter((value): value is string => typeof value === "string")
    : [];
  if (!dates.includes(localDate))
    storage.set(DAILY_COMPLETION_DATES_KEY, [...dates, localDate]);
  return calculateDailyStreak([...dates, localDate], localDate);
}

export function getDailyStreak(
  storage: StorageAdapter,
  localToday = getLocalDate(),
) {
  const stored = storage.get<unknown>(DAILY_COMPLETION_DATES_KEY);
  return calculateDailyStreak(
    Array.isArray(stored)
      ? stored.filter((v): v is string => typeof v === "string")
      : [],
    localToday,
  );
}
