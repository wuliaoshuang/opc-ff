import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompactNumber } from '@/lib/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
}

function compactValue(value: string | number) {
  if (typeof value === 'number') {
    return formatCompactNumber(value)
  }

  const numeric = Number(value.replace(/[¥,\s]/g, ''))
  if (!Number.isFinite(numeric) || Math.abs(numeric) < 1000) return value
  const prefix = value.trim().startsWith('¥') ? '¥' : ''
  return `${prefix}${formatCompactNumber(numeric)}`
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
}: StatCardProps) {
  const ChangeIcon =
    changeType === 'up'
      ? TrendingUp
      : changeType === 'down'
        ? TrendingDown
        : Minus

  return (
    <Card className="min-w-0 overflow-hidden rounded-xl border-border/70 shadow-none md:rounded-2xl">
      <CardContent className="p-3.5 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-medium leading-tight text-muted-foreground md:text-sm">{title}</p>
          {Icon && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="min-w-0 truncate text-[22px] font-bold leading-none tracking-tight md:text-2xl">
            <span className="sm:hidden">{compactValue(value)}</span>
            <span className="hidden sm:inline">{value}</span>
          </span>
          {change && (
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 text-xs',
                changeType === 'up' && 'text-emerald-600',
                changeType === 'down' && 'text-red-500',
                changeType === 'neutral' && 'text-muted-foreground',
              )}
            >
              <ChangeIcon className="h-3 w-3" />
              {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
