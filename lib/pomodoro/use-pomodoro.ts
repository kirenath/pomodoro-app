"use client";

// A thin React layer over the pure engine. The hook owns the wall-clock
// ticking and routes engine effects (persist session, chime, phase change)
// out to the caller. All real logic lives in engine.ts.

import { useCallback, useEffect, useRef, useState } from "react";

import { playChime } from "@/lib/audio/chime";
import {
  createInitialState,
  durationSecFor,
  type PomodoroEffect,
  type PomodoroEvent,
  type PomodoroState,
  reducePomodoro,
} from "@/lib/pomodoro/engine";
import { statsStore } from "@/lib/storage/stats-store";
import type { Session, SessionKind, Settings } from "@/lib/types";

interface UsePomodoroOptions {
  settings: Settings;
  onSessionCompleted?: (session: Session) => void;
  onPhaseEntered?: (phase: SessionKind, autoStarted: boolean) => void;
}

export interface UsePomodoroResult {
  phase: SessionKind;
  status: PomodoroState["status"];
  remainingSec: number;
  totalSec: number;
  progress: number; // 0..1 elapsed
  focusInCycle: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
}

export function usePomodoro(options: UsePomodoroOptions): UsePomodoroResult {
  const { settings, onSessionCompleted, onPhaseEntered } = options;

  const [state, setState] = useState<PomodoroState>(() =>
    createInitialState(settings),
  );
  const lastTickRef = useRef<number>(Date.now());

  // Keep the latest callbacks/settings in refs so the tick loop stays stable.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onSessionRef = useRef(onSessionCompleted);
  onSessionRef.current = onSessionCompleted;
  const onPhaseRef = useRef(onPhaseEntered);
  onPhaseRef.current = onPhaseEntered;

  const runEffects = useCallback((effects: PomodoroEffect[]) => {
    for (const effect of effects) {
      if (effect.type === "SESSION_COMPLETED") {
        void statsStore.addSession(effect.session).catch((err) => {
          console.error("Failed to save session:", err);
        });
        onSessionRef.current?.(effect.session);
      } else if (effect.type === "CHIME") {
        playChime();
      } else if (effect.type === "PHASE_ENTERED") {
        onPhaseRef.current?.(effect.phase, effect.autoStarted);
      }
    }
  }, []);

  const dispatch = useCallback(
    (event: PomodoroEvent) => {
      setState((prev) => {
        const result = reducePomodoro(prev, event, settingsRef.current);
        // Effects are side effects; defer out of the state updater.
        if (result.effects.length > 0) {
          queueMicrotask(() => runEffects(result.effects));
        }
        return result.state;
      });
    },
    [runEffects],
  );

  // Wall-clock ticking, robust to background-tab throttling.
  useEffect(() => {
    if (state.status !== "running") return;
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      dispatch({ type: "TICK", now, deltaSec });
    }, 500);
    return () => window.clearInterval(id);
  }, [state.status, dispatch]);

  // When idle, reflect any duration changes from settings immediately.
  useEffect(() => {
    if (state.status !== "idle") return;
    const fresh = durationSecFor(state.phase, settings);
    setState((prev) =>
      prev.remainingSec === fresh ? prev : { ...prev, remainingSec: fresh },
    );
  }, [settings, state.phase, state.status]);

  const start = useCallback(
    () => dispatch({ type: "START", now: Date.now() }),
    [dispatch],
  );
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), [dispatch]);
  const resume = useCallback(
    () => dispatch({ type: "RESUME", now: Date.now() }),
    [dispatch],
  );
  const skip = useCallback(
    () => dispatch({ type: "SKIP", now: Date.now() }),
    [dispatch],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), [dispatch]);

  const totalSec = durationSecFor(state.phase, settings);
  const remainingSec = Math.max(0, state.remainingSec);
  const progress = totalSec > 0 ? 1 - remainingSec / totalSec : 0;

  return {
    phase: state.phase,
    status: state.status,
    remainingSec,
    totalSec,
    progress: Math.min(1, Math.max(0, progress)),
    focusInCycle: state.focusInCycle,
    start,
    pause,
    resume,
    skip,
    reset,
  };
}
