'use client'
import { cn } from '@/lib/utils'

type BadgeVariant = 'active' | 'idle' | 'error' | 'warning'

export function Badge({ variant = 'idle', children, className }: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn(
      variant === 'active'  ? 'badge-active'  :
      variant === 'error'   ? 'badge-error'   :
      variant === 'warning' ? 'badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              'badge-idle',
      className
    )}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-weaver animate-pulse" />}
      {children}
    </span>
  )
}
