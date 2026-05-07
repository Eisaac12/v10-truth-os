'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import {
  LayoutDashboard, Sparkles, Bot, DollarSign,
  FileText, Settings, Zap
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { href: '/weave',     icon: Sparkles,         label: 'Truth Weaver' },
  { href: '/agents',   icon: Bot,               label: 'Agent Matrix' },
  { href: '/income',   icon: DollarSign,        label: 'Income' },
  { href: '/content',  icon: FileText,          label: 'Content Studio' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen flex flex-col border-r border-white/5 bg-void/80 backdrop-blur-xl shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-weaver/10 border border-weaver/20 flex items-center justify-center text-weaver font-bold text-lg">
            ◈
          </div>
          <div>
            <div className="font-semibold text-white text-sm tracking-wide">Truth Weaver</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FrequencyBars size="sm" />
              <span className="text-[10px] text-weaver/70 font-mono">7.83Hz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-weaver/10 text-weaver-light border border-weaver/20 font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <Icon size={16} className={active ? 'text-weaver' : ''} />
              {label}
              {active && href === '/weave' && (
                <span className="ml-auto">
                  <FrequencyBars size="sm" />
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <Settings size={16} />
          Settings
        </Link>
        <div className="px-3 py-2 mt-1">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-weaver/5 border border-weaver/10">
            <Zap size={12} className="text-weaver" />
            <span className="text-[11px] text-weaver/70 font-mono">Matrix: online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
