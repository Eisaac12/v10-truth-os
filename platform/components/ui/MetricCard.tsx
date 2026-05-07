'use client'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
  className?: string
}

export function MetricCard({ label, value, sub, trend, accent, className }: MetricCardProps) {
  return (
    <div className={cn('metric-card', className)}>
      <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</span>
      <span className={cn(
        'text-2xl font-bold font-mono',
        accent ? 'text-weaver-gradient' : 'text-white'
      )}>
        {value}
      </span>
      {sub && (
        <span className={cn(
          'text-xs',
          trend === 'up'      ? 'text-weaver-light' :
          trend === 'down'    ? 'text-red-400' :
                                'text-white/40'
        )}>
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{sub}
        </span>
      )}
    </div>
  )
}
