'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type BreathPhase = 'inhale' | 'hold' | 'exhale'

// 4-7-8 breathing rhythm used during breaks.
const PATTERN: { phase: BreathPhase; sec: number; label: string }[] = [
  { phase: 'inhale', sec: 4, label: '吸气' },
  { phase: 'hold', sec: 7, label: '屏息' },
  { phase: 'exhale', sec: 8, label: '呼气' },
]

function use478(active: boolean) {
  const [index, setIndex] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      setIndex(0)
      return
    }
    const step = PATTERN[index]
    timeoutRef.current = window.setTimeout(
      () => setIndex((i) => (i + 1) % PATTERN.length),
      step.sec * 1000,
    )
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [active, index])

  return PATTERN[index]
}

interface BreathingCircleProps {
  mode: 'focus' | 'break'
  active: boolean
  children: React.ReactNode
}

export function BreathingCircle({
  mode,
  active,
  children,
}: BreathingCircleProps) {
  const breath = use478(mode === 'break' && active)

  // Scale + transition timing for the break rhythm.
  const breakScale =
    breath.phase === 'inhale' ? 1 : breath.phase === 'exhale' ? 0.82 : 1
  const breakTransition =
    breath.phase === 'inhale'
      ? '4s'
      : breath.phase === 'exhale'
        ? '8s'
        : '7s'

  return (
    <div className="relative flex aspect-square w-full max-w-[18rem] items-center justify-center sm:max-w-[22rem]">
      {/* Soft outer halo */}
      <div className="absolute inset-0 rounded-full bg-primary/5" />
      <div className="absolute inset-[8%] rounded-full bg-primary/5" />

      {/* The breathing body */}
      <div
        className={cn(
          'absolute inset-[14%] rounded-full bg-primary/15 ring-1 ring-primary/20',
          mode === 'focus' && active && 'animate-breathe',
          mode === 'focus' && !active && 'scale-95 opacity-80',
        )}
        style={
          mode === 'break'
            ? {
                transform: `scale(${active ? breakScale : 0.9})`,
                transition: `transform ${active ? breakTransition : '1s'} ease-in-out`,
              }
            : undefined
        }
      />

      {/* Content (timer + labels) sits centered and still */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-center">
        {mode === 'break' && active && (
          <span className="text-sm font-medium tracking-widest text-primary">
            {breath.label}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
