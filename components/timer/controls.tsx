'use client'

import { Pause, Play, SkipForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PomodoroStatus } from '@/lib/pomodoro/engine'

interface ControlsProps {
  status: PomodoroStatus
  phase: 'focus' | 'short_break' | 'long_break'
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onSkip: () => void
}

export function Controls({
  status,
  phase,
  onStart,
  onPause,
  onResume,
  onSkip,
}: ControlsProps) {
  const skipLabel = phase === 'focus' ? '结束这一段' : '跳过休息'

  return (
    <div className="flex items-center justify-center gap-3">
      {status === 'idle' && (
        <Button size="lg" className="h-11 px-7 text-base" onClick={onStart}>
          <Play className="size-4" aria-hidden="true" />
          开始
        </Button>
      )}

      {status === 'running' && (
        <Button
          size="lg"
          variant="secondary"
          className="h-11 px-7 text-base"
          onClick={onPause}
        >
          <Pause className="size-4" aria-hidden="true" />
          暂停
        </Button>
      )}

      {status === 'paused' && (
        <Button size="lg" className="h-11 px-7 text-base" onClick={onResume}>
          <Play className="size-4" aria-hidden="true" />
          继续
        </Button>
      )}

      {/* Always visible: ending a segment is never hidden. */}
      <Button
        size="lg"
        variant="ghost"
        className="h-11 px-5 text-base text-muted-foreground"
        onClick={onSkip}
      >
        <SkipForward className="size-4" aria-hidden="true" />
        {skipLabel}
      </Button>
    </div>
  )
}
