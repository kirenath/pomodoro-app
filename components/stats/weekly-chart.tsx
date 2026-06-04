'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { DailyAggregate } from '@/lib/types'

interface WeeklyChartProps {
  data: DailyAggregate[]
}

function shortLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${Number(m)}/${Number(d)}`
}

interface TooltipPayload {
  active?: boolean
  payload?: { payload: DailyAggregate }[]
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <div className="text-muted-foreground">{shortLabel(item.date)}</div>
      <div className="font-medium text-foreground">
        {item.focusMinutes} 分钟 · {item.pomodoros} 个番茄
      </div>
    </div>
  )
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.map((d) => ({ ...d, label: shortLabel(d.date) }))
  const hasData = data.some((d) => d.focusMinutes > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近 7 天</CardTitle>
        <CardDescription>每天的专注分钟</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  content={<ChartTooltip />}
                />
                <Bar
                  dataKey="focusMinutes"
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              这一周还没有记录，慢慢来
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
