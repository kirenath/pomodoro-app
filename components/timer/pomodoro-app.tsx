"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Pin } from "lucide-react";

import { BreathingCircle } from "@/components/timer/breathing-circle";
import { Controls } from "@/components/timer/controls";
import { MiniTimer } from "@/components/timer/mini-timer";
import { TimerDisplay } from "@/components/timer/timer-display";
import { useSettings } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePomodoro } from "@/lib/pomodoro/use-pomodoro";
import { enterMiniMode, exitMiniMode, isTauri } from "@/lib/tauri";
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

  const [mini, setMini] = useState(false);
  const [inTauri, setInTauri] = useState(false);

  useEffect(() => {
    setInTauri(isTauri());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("mini", mini);
    return () => document.documentElement.classList.remove("mini");
  }, [mini]);

  const enterMini = useCallback(() => {
    setMini(true);
    void enterMiniMode();
  }, []);

  const exitMini = useCallback(() => {
    setMini(false);
    void exitMiniMode();
  }, []);

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

  if (mini) {
    return (
      <MiniTimer
        remainingSec={remainingSec}
        status={status}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onExit={exitMini}
      />
    );
  }

  return (
    <main
      className={cn(
        "relative flex flex-col items-center px-4 pb-16 pt-10 transition-colors duration-1000 sm:pt-16",
        glow ? "bg-accent/40" : "bg-background",
      )}
    >
      {inTauri && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 text-muted-foreground"
          onClick={enterMini}
          aria-label="进入迷你模式"
        >
          <Pin className="size-4" aria-hidden="true" />
        </Button>
      )}

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
