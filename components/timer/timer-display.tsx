'use client'

import { formatClock } from '@/lib/format'

interface TimerDisplayProps {
  remainingSec: number
}

export function TimerDisplay({ remainingSec }: TimerDisplayProps) {
  return (
    <span className="font-sans text-6xl font-light tabular-nums tracking-tight text-foreground sm:text-7xl">
      {formatClock(remainingSec)}
    </span>
  )
}
