import { Card } from '@/components/ui/card'

interface MetricProps {
  label: string
  value: string
  hint?: string
}

export function Metric({ label, value, hint }: MetricProps) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-light tabular-nums text-foreground">
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  )
}
