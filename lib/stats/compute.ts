// Pure aggregation helpers over Session[]. No storage, no React.

import type { DailyAggregate, Session } from "@/lib/types";

export type RangeKey = "today" | "7d" | "30d" | "all";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "今日",
  "7d": "7 天",
  "30d": "30 天",
  all: "全部",
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rangeStart(range: RangeKey): Date | null {
  if (range === "all") return null;
  const start = startOfToday();
  if (range === "today") return start;
  const days = range === "7d" ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export function filterByRange(sessions: Session[], range: RangeKey): Session[] {
  const start = rangeStart(range);
  if (!start) return sessions;
  const fromMs = start.getTime();
  return sessions.filter((s) => new Date(s.startedAt).getTime() >= fromMs);
}

export function focusSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.kind === "focus" && s.completed);
}

export interface TodaySummary {
  pomodoros: number;
  focusMinutes: number;
}

export function todaySummary(sessions: Session[]): TodaySummary {
  const todays = focusSessions(filterByRange(sessions, "today"));
  return {
    pomodoros: todays.length,
    focusMinutes: todays.reduce(
      (sum, s) => sum + Math.round(s.durationSec / 60),
      0,
    ),
  };
}

export interface Overview {
  totalPomodoros: number;
  totalFocusMinutes: number;
  streakDays: number;
}

export function getStreakDays(sessions: Session[]): number {
  const keys = new Set(
    focusSessions(sessions).map((s) => localDateKey(new Date(s.startedAt))),
  );
  if (keys.size === 0) return 0;

  let streak = 0;
  const cursor = startOfToday();
  // Count consecutive days ending today that have at least one pomodoro.
  while (keys.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function overview(sessions: Session[]): Overview {
  const focus = focusSessions(sessions);
  return {
    totalPomodoros: focus.length,
    totalFocusMinutes: focus.reduce(
      (sum, s) => sum + Math.round(s.durationSec / 60),
      0,
    ),
    streakDays: getStreakDays(sessions),
  };
}

export function dailyAggregates(
  sessions: Session[],
  days: number,
): DailyAggregate[] {
  const focus = focusSessions(sessions);
  const today = startOfToday();
  const buckets: DailyAggregate[] = [];
  const indexByDate = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = localDateKey(d);
    indexByDate.set(key, buckets.length);
    buckets.push({ date: key, focusMinutes: 0, pomodoros: 0 });
  }

  for (const s of focus) {
    const key = localDateKey(new Date(s.startedAt));
    const idx = indexByDate.get(key);
    if (idx === undefined) continue;
    buckets[idx].focusMinutes += Math.round(s.durationSec / 60);
    buckets[idx].pomodoros += 1;
  }

  return buckets;
}
