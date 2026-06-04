"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BreathingCircle } from "@/components/timer/breathing-circle";
import { Controls } from "@/components/timer/controls";
import { TimerDisplay } from "@/components/timer/timer-display";
import { useSettings } from "@/components/settings-provider";
import { useToast } from "@/components/ui/toast";
import { usePomodoro } from "@/lib/pomodoro/use-pomodoro";
import type { SessionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASE_TITLE: Record<SessionKind, string> = {
  focus: "专注",
  short_break: "短休息",
  long_break: "长休息",
};

function subtitleFor(phase: SessionKind, status: string): string {
  if (phase === "focus") {
    if (status === "idle") return "准备好了，就开始这一段";
    return "在这里就好";
  }
  if (phase === "long_break") return "走一走，喝点水，慢慢呼吸";
  return "做完这一段，慢慢呼吸";
}

export function PomodoroApp() {
  const { settings, hydrated } = useSettings();
  const { toast } = useToast();

  const [glow, setGlow] = useState(false);
  const glowTimeout = useRef<number | null>(null);

  const handleSessionCompleted = useCallback(() => {
    toast("又一段安静的时间，记下来了");
    // Gentle background shift on completion.
    setGlow(true);
    if (glowTimeout.current) window.clearTimeout(glowTimeout.current);
    glowTimeout.current = window.setTimeout(() => setGlow(false), 2400);
  }, [toast]);

  const {
    phase,
    status,
    remainingSec,
    focusInCycle,
    start,
    pause,
    resume,
    skip,
  } = usePomodoro({
    settings,
    onSessionCompleted: handleSessionCompleted,
  });

  useEffect(() => {
    return () => {
      if (glowTimeout.current) window.clearTimeout(glowTimeout.current);
    };
  }, []);

  const isFocus = phase === "focus";
  const dotCount = Math.max(1, settings.cyclesPerLongBreak);

  return (
    <main
      className={cn(
        "relative flex flex-col items-center px-4 pb-16 pt-10 transition-colors duration-1000 sm:pt-16",
        glow ? "bg-accent/40" : "bg-background",
      )}
    >
      {/* Phase heading */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-medium tracking-wide text-primary">
          {PHASE_TITLE[phase]}
        </span>
        <p className="text-pretty text-base text-muted-foreground">
          {subtitleFor(phase, status)}
        </p>
      </div>

      {/* Breathing circle with the timer at its center */}
      <div className="mt-8 flex w-full justify-center sm:mt-10">
        <BreathingCircle
          mode={isFocus ? "focus" : "break"}
          active={status === "running"}
        >
          {hydrated ? (
            <TimerDisplay remainingSec={remainingSec} />
          ) : (
            <span className="text-6xl font-light tabular-nums text-muted-foreground/50 sm:text-7xl">
              --:--
            </span>
          )}
        </BreathingCircle>
      </div>

      {/* Cycle progress dots */}
      <div className="mt-8 flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full transition-colors",
              i < focusInCycle ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <span className="sr-only">
        本轮已完成 {focusInCycle} / {dotCount} 个专注段
      </span>

      {/* Controls — always visible */}
      <div className="mt-10">
        <Controls
          status={status}
          phase={phase}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onSkip={skip}
        />
      </div>
    </main>
  );
}
