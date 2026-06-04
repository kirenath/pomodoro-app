// Pure, framework-agnostic Pomodoro state machine.
// No React, no globals, no side effects: feed it (state, event, settings)
// and it returns the next state plus a list of effects for the UI to run.
// This makes the whole engine trivially unit-testable.

import type { Session, SessionKind, Settings } from "@/lib/types";

export type PomodoroStatus = "idle" | "running" | "paused";

export interface PomodoroState {
  phase: SessionKind;
  status: PomodoroStatus;
  remainingSec: number;
  /** Focus segments completed since the last long break. */
  focusInCycle: number;
  /** ISO start time of the currently active (or just-finished) segment. */
  segmentStartedAt?: string;
}

export type PomodoroEvent =
  | { type: "START"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME"; now: number }
  | { type: "SKIP"; now: number }
  | { type: "TICK"; now: number; deltaSec?: number }
  | { type: "RESET" };

export type PomodoroEffect =
  | { type: "SESSION_COMPLETED"; session: Session }
  | { type: "PHASE_ENTERED"; phase: SessionKind; autoStarted: boolean }
  | { type: "CHIME" };

export interface ReduceResult {
  state: PomodoroState;
  effects: PomodoroEffect[];
}

export function durationSecFor(phase: SessionKind, settings: Settings): number {
  switch (phase) {
    case "focus":
      return Math.max(1, Math.round(settings.focusMin * 60));
    case "short_break":
      return Math.max(1, Math.round(settings.shortBreakMin * 60));
    case "long_break":
      return Math.max(1, Math.round(settings.longBreakMin * 60));
  }
}

export function createInitialState(settings: Settings): PomodoroState {
  return {
    phase: "focus",
    status: "idle",
    remainingSec: durationSecFor("focus", settings),
    focusInCycle: 0,
  };
}

/** Which phase follows the one that just ended (after a completed focus segment). */
function nextPhaseAfterFocus(
  focusInCycle: number,
  settings: Settings,
): SessionKind {
  const completed = focusInCycle + 1;
  return completed >= settings.cyclesPerLongBreak
    ? "long_break"
    : "short_break";
}

export function reducePomodoro(
  state: PomodoroState,
  event: PomodoroEvent,
  settings: Settings,
): ReduceResult {
  switch (event.type) {
    case "START": {
      if (state.status === "running") return { state, effects: [] };
      return {
        state: {
          ...state,
          status: "running",
          segmentStartedAt: new Date(event.now).toISOString(),
        },
        effects: [
          { type: "PHASE_ENTERED", phase: state.phase, autoStarted: false },
        ],
      };
    }

    case "PAUSE": {
      if (state.status !== "running") return { state, effects: [] };
      return { state: { ...state, status: "paused" }, effects: [] };
    }

    case "RESUME": {
      if (state.status !== "paused") return { state, effects: [] };
      return { state: { ...state, status: "running" }, effects: [] };
    }

    case "SKIP": {
      // Abandon the current segment without recording it (never store half segments).
      if (state.phase === "focus") {
        return {
          state: {
            phase: "short_break",
            status: "idle",
            remainingSec: durationSecFor("short_break", settings),
            focusInCycle: state.focusInCycle,
            segmentStartedAt: undefined,
          },
          effects: [
            { type: "PHASE_ENTERED", phase: "short_break", autoStarted: false },
          ],
        };
      }
      // Skipping a break -> back to focus, idle so the user re-enters intentionally.
      return {
        state: {
          phase: "focus",
          status: "idle",
          remainingSec: durationSecFor("focus", settings),
          focusInCycle: state.focusInCycle,
          segmentStartedAt: undefined,
        },
        effects: [
          { type: "PHASE_ENTERED", phase: "focus", autoStarted: false },
        ],
      };
    }

    case "TICK": {
      if (state.status !== "running") return { state, effects: [] };
      const delta = event.deltaSec ?? 1;
      const remaining = state.remainingSec - delta;
      if (remaining > 0) {
        return { state: { ...state, remainingSec: remaining }, effects: [] };
      }

      // Segment completed naturally.
      const effects: PomodoroEffect[] = [];

      if (state.phase === "focus") {
        const startedAt =
          state.segmentStartedAt ?? new Date(event.now).toISOString();
        const session: Session = {
          id: `sess_${new Date(startedAt).getTime()}`,
          startedAt,
          durationSec: durationSecFor("focus", settings),
          kind: "focus",
          completed: true,
        };
        effects.push({ type: "SESSION_COMPLETED", session });
        effects.push({ type: "CHIME" });

        const focusInCycle = state.focusInCycle + 1;
        const next = nextPhaseAfterFocus(state.focusInCycle, settings);
        const resetCycle = next === "long_break";
        // Auto-flow into the restful break so the user doesn't have to act.
        effects.push({ type: "PHASE_ENTERED", phase: next, autoStarted: true });
        return {
          state: {
            phase: next,
            status: "running",
            remainingSec: durationSecFor(next, settings),
            focusInCycle: resetCycle ? 0 : focusInCycle,
            segmentStartedAt: new Date(event.now).toISOString(),
          },
          effects,
        };
      }

      // A break ended: chime, then return to focus but stay idle so starting work
      // is always a deliberate choice (less pressure).
      effects.push({ type: "CHIME" });
      effects.push({
        type: "PHASE_ENTERED",
        phase: "focus",
        autoStarted: false,
      });
      return {
        state: {
          phase: "focus",
          status: "idle",
          remainingSec: durationSecFor("focus", settings),
          focusInCycle: state.focusInCycle,
          segmentStartedAt: undefined,
        },
        effects,
      };
    }

    case "RESET": {
      return { state: createInitialState(settings), effects: [] };
    }

    default:
      return { state, effects: [] };
  }
}
