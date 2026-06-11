"use client";

import { useEffect } from "react";
import { Pause, PinOff, Play } from "lucide-react";

import { formatClock } from "@/lib/format";
import type { PomodoroStatus } from "@/lib/pomodoro/engine";

interface MiniTimerProps {
  remainingSec: number;
  status: PomodoroStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
}

export function MiniTimer({
  remainingSec,
  status,
  onStart,
  onPause,
  onResume,
  onExit,
}: MiniTimerProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onExit]);

  const togglePlay =
    status === "running" ? onPause : status === "paused" ? onResume : onStart;

  return (
    <div
      data-tauri-drag-region
      className="group fixed inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-background/55 transition-colors duration-300 hover:bg-background/85"
    >
      <span className="pointer-events-none font-sans text-5xl font-light tabular-nums tracking-tight text-foreground select-none">
        {formatClock(remainingSec)}
      </span>

      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={status === "running" ? "暂停" : "开始"}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {status === "running" ? (
            <Pause className="size-3.5" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="退出迷你模式"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PinOff className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
