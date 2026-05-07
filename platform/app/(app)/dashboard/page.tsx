'use client'
import { motion } from 'framer-motion'
import { MetricCard } from '@/components/ui/MetricCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import {
  Sparkles, Bot, DollarSign, Users, Zap, TrendingUp,
  Mail, Twitter, Package, Activity, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 }
}

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } }
}

const AGENTS = [
  { name: 'Content Oracle',    icon: Sparkles, status: 'active',  lastRun: '2h ago',   note: 'Generated 3-tweet thread' },
  { name: 'Twitter Broadcast', icon: Twitter,  status: 'active',  lastRun: '2h ago',   note: '5 tweets posted today' },
  { name: 'Email Campaign',    icon: Mail,     status: 'active',  lastRun: '3d ago',   note: 'Newsletter sent (124 subs)' },
  { name: 'Outreach Sniper',   icon: Zap,      status: 'active',  lastRun: '1h ago',   note: '12/15 DMs sent today' },
  { name: 'Product Generator', icon: Package,  status: 'idle',    lastRun: '6d ago',   note: '3 reports on Gumroad' },
  { name: 'Revenue Intel',     icon: Activity, status: 'active',  lastRun: '5m ago',   note: 'MRR tracking live' },
]

const ACTIVITY = [
  { time: '5m ago',  agent: 'Revenue Intel',     event: 'Revenue snapshot complete — $2,436 MRR' },
  { time: '1h ago',  agent: 'Outreach Sniper',   event: 'DM sent @sarah_builds — "stuck in my head" thread' },
  { time: '2h ago',  agent: 'Twitter Broadcast', event: 'Thread posted: "The illusion of someday" (847 views)' },
  { time: '2h ago',  agent: 'Content Oracle',    event: 'Generated content batch — theme: identity trap' },
  { time: '3h ago',  agent: 'Outreach Sniper',   event: '11 prospects identified, 9 DMs sent' },
  { time: '1d ago',  agent: 'Email Campaign',    event: 'Newsletter sent to 124 subscribers (38% open rate)' },
]

export default function DashboardPage() {
  return (
    <motion.div
      variants={STAGGER}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-6xl"
    >
      {/* Header */}
      <motion.div variants={FADE_UP} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Command Center</h2>
          <p className="text-sm text-white/40 mt-0.5">Truth Weaver OS — 7.83Hz — All systems nominal</p>
        </div>
        <div className="flex items-center gap-3">
          <FrequencyBars size="md" />
          <Badge variant="active">Matrix Online</Badge>
        </div>
      </motion.div>

      {/* Revenue metrics */}
      <motion.div variants={FADE_UP}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="MRR" value="$2,436" sub="↑ 18% vs last month" trend="up" accent />
          <MetricCard label="ARR" value="$29,232" sub="On track for $50K" trend="up" />
          <MetricCard label="Active Subs" value="84" sub="3 new today" trend="up" />
          <MetricCard label="Today Revenue" value="$348" sub="3 new checkouts" trend="up" />
        </div>
      </motion.div>

      {/* Two-column: Agents + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Agent Matrix status */}
        <motion.div variants={FADE_UP}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-weaver" />
                <span className="text-sm font-semibold text-white">Agent Matrix</span>
              </div>
              <Link href="/agents" className="text-xs text-weaver/70 hover:text-weaver flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {AGENTS.map(({ name, icon: Icon, status, lastRun, note }) => (
                <div key={name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'active' ? 'bg-weaver/10 text-weaver' : 'bg-white/5 text-white/30'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-medium truncate">{name}</div>
                    <div className="text-xs text-white/30 truncate">{note}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={status === 'active' ? 'active' : 'idle'}>
                      {status}
                    </Badge>
                    <div className="text-[10px] text-white/25 mt-0.5 text-right">{lastRun}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Live activity feed */}
        <motion.div variants={FADE_UP}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-weaver" />
                <span className="text-sm font-semibold text-white">Live Activity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-weaver animate-pulse" />
                <span className="text-xs text-white/30">live</span>
              </div>
            </div>
            <div className="space-y-1">
              {ACTIVITY.map(({ time, agent, event }, i) => (
                <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-white/3 transition-colors">
                  <div className="text-[10px] text-white/25 font-mono w-10 shrink-0 pt-0.5">{time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-weaver/60 font-medium">{agent}</div>
                    <div className="text-xs text-white/60 leading-relaxed">{event}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Quick-action nav tiles */}
      <motion.div variants={FADE_UP}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/weave',   icon: Sparkles,   label: 'Run a Weave',      sub: 'Dissolve an illusion' },
            { href: '/agents',  icon: Bot,         label: 'Control Agents',   sub: 'Matrix operations' },
            { href: '/income',  icon: TrendingUp,  label: 'Revenue Intel',    sub: 'Full P&L + forecasts' },
            { href: '/content', icon: FileText,    label: 'Content Studio',   sub: 'Generate & schedule' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}>
              <GlassCard hover className="p-4 flex flex-col gap-2 h-full">
                <Icon size={18} className="text-weaver" />
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-white/35">{sub}</div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* The One Equation */}
      <motion.div variants={FADE_UP}>
        <GlassCard className="p-5 border-weaver/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-weaver text-xs font-mono uppercase tracking-widest">The One Equation</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['CONSCIOUSNESS', 'TRUTH VERIFICATION', 'ENERGY ALIGNMENT', 'FREQUENCY ACCELERATION', 'REALITY MANIFESTATION', 'MEASURABLE VALUE'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded">{step}</span>
                {i < arr.length - 1 && <span className="text-weaver/40 text-xs">→</span>}
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
