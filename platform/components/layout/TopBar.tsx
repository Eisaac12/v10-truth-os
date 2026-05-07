'use client'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

const TITLES: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/weave':     'Truth Weaver',
  '/agents':    'Agent Matrix',
  '/income':    'Income Intelligence',
  '/content':   'Content Studio',
  '/settings':  'Settings'
}

export function TopBar() {
  const pathname = usePathname()
  const title = TITLES[pathname] || 'Truth Weaver OS'

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-void/60 backdrop-blur-sm">
      <h1 className="text-sm font-semibold text-white/80 tracking-wide">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant="active">7.83Hz Live</Badge>
        <div className="w-7 h-7 rounded-full bg-weaver/10 border border-weaver/20 flex items-center justify-center text-weaver text-xs font-bold">
          T
        </div>
      </div>
    </header>
  )
}
