// Centralized domain types. Identifiers in English, UI copy in Chinese.

export type SessionKind = "focus" | "short_break" | "long_break";

export interface Session {
  id: string;
  startedAt: string; // ISO timestamp
  durationSec: number;
  kind: SessionKind;
  /**
   * Legacy field kept for backwards compatibility with sessions saved by
   * earlier versions of the app. New sessions don't set it.
   */
  tag?: string;
  completed: boolean;
}

export type ThemePreference = "light" | "dark" | "auto";

export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesPerLongBreak: number;
  theme: ThemePreference;
}

// Pre-aggregated focus minutes per calendar day, used by the stats charts.
export interface DailyAggregate {
  date: string; // YYYY-MM-DD (local)
  focusMinutes: number;
  pomodoros: number;
}

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesPerLongBreak: 4,
  theme: "auto",
};
