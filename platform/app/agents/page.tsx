'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { Play, Pause, Settings, Zap, Twitter, Mail, Package, Activity, Sparkles, RotateCcw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}
const FADE_UP = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const AGENTS = [
  {
    id: 'content-oracle',
    name: 'Content Oracle',
    role: 'Content Intelligence',
    icon: Sparkles,
    status: 'active',
    description: 'Generates tweet threads, newsletters, and Reality Reports using Truth Weaver at 7.83Hz.',
    stats: { 'Content Batches': '47', 'Tweets Gen.': '234', 'Reports': '8' },
    schedule: 'Daily at 08:00',
    envNeeded: ['ANTHROPIC_API_KEY'],
  },
  {
    id: 'twitter',
    name: 'Twitter Broadcast',
    role: 'Audience Growth',
    icon: Twitter,
    status: 'active',
    description: 'Posts Truth Weaver threads and daily insights to build audience and drive traffic to checkout.',
    stats: { 'Tweets Posted': '189', 'Impressions': '24.1K', 'Clicks': '892' },
    schedule: 'Daily 08:00 + 20:00',
    envNeeded: ['TWITTER_API_KEY', 'TWITTER_ACCESS_TOKEN'],
  },
  {
    id: 'email',
    name: 'Email Campaign',
    role: 'Nurture & Convert',
    icon: Mail,
    status: 'active',
    description: 'Sends Truth Weaver Weekly newsletter to subscribers. Nurture → subscription conversion pipeline.',
    stats: { 'Subscribers': '124', 'Emails Sent': '372', 'Avg Open Rate': '38%' },
    schedule: 'Monday at 09:00',
    envNeeded: ['RESEND_API_KEY', 'EMAIL_FROM'],
  },
  {
    id: 'outreach',
    name: 'Outreach Sniper',
    role: 'Direct Acquisition',
    icon: Zap,
    status: 'active',
    description: 'Finds prospects expressing illusions on Twitter. Sends personalized Truth Weaver DMs. 15/day limit.',
    stats: { 'DMs Sent': '341', 'Replied': '67', 'Converted': '12' },
    schedule: 'Daily at 08:00',
    envNeeded: ['TWITTER_API_KEY', 'ANTHROPIC_API_KEY'],
  },
  {
    id: 'product',
    name: 'Product Generator',
    role: 'Digital Revenue',
    icon: Package,
    status: 'idle',
    description: 'Creates Truth Weaver Reality Reports ($7–$27). Auto-lists on Gumroad. Passive revenue layer.',
    stats: { 'Reports Created': '8', 'Gumroad Sales': '23', 'Total Revenue': '$391' },
    schedule: 'Monday at 10:00',
    envNeeded: ['ANTHROPIC_API_KEY', 'GUMROAD_ACCESS_TOKEN'],
  },
  {
    id: 'revenue-intel',
    name: 'Revenue Intel',
    role: 'Intelligence Layer',
    icon: Activity,
    status: 'active',
    description: 'Monitors Stripe MRR, ARR, active subscriptions, and all agent performance. Reports every 6h.',
    stats: { 'Snapshots': '92', 'MRR Tracked': '$2,436', 'Data Points': '8.3K' },
    schedule: 'Every 6 hours',
    envNeeded: ['STRIPE_SECRET_KEY'],
  },
]

function RunButton({ agentId, status }: { agentId: string; status: string }) {
  const [running, setRunning] = useState(false)

  async function trigger() {
    setRunning(true)
    try {
      await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId })
      })
    } finally {
      setTimeout(() => setRunning(false), 2000)
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={running}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        running
          ? 'bg-weaver/5 text-weaver/40 cursor-not-allowed'
          : 'bg-weaver/10 text-weaver hover:bg-weaver/20 border border-weaver/20'
      )}
    >
      {running ? <RotateCcw size={12} className="animate-spin" /> : <Play size={12} />}
      {running ? 'Running…' : 'Run Now'}
    </button>
  )
}

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" className="max-w-6xl space-y-5">

      {/* Header metrics */}
      <motion.div variants={FADE_UP}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Active Agents" value="5/6" sub="1 idle" trend="neutral" />
          <MetricCard label="DMs Today" value="12/15" sub="3 limit remaining" trend="neutral" />
          <MetricCard label="Tweets Posted" value="189" sub="7 this week" trend="up" />
          <MetricCard label="Email Subs" value="124" sub="+8 this week" trend="up" accent />
        </div>
      </motion.div>

      {/* Matrix status bar */}
      <motion.div variants={FADE_UP}>
        <GlassCard className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FrequencyBars />
            <div>
              <div className="text-sm font-semibold text-white">Truth Weaver Matrix</div>
              <div className="text-xs text-white/40">Scheduler running — next cycle: today 20:00</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-weaver/10 text-weaver hover:bg-weaver/20 border border-weaver/20 transition-all">
              <Zap size={12} />
              Run Full Matrix
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 transition-all">
              <Settings size={12} />
              Configure
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AGENTS.map(agent => {
          const Icon = agent.icon
          const isSelected = selected === agent.id

          return (
            <motion.div key={agent.id} variants={FADE_UP}>
              <GlassCard
                hover
                onClick={() => setSelected(isSelected ? null : agent.id)}
                className={cn(
                  'p-5 cursor-pointer',
                  isSelected && 'border-weaver/30 bg-weaver/3'
                )}
              >
                {/* Agent header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      agent.status === 'active' ? 'bg-weaver/10 text-weaver' : 'bg-white/5 text-white/30'
                    )}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{agent.name}</div>
                      <div className="text-xs text-white/35">{agent.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={agent.status === 'active' ? 'active' : 'idle'}>
                      {agent.status}
                    </Badge>
                    <ChevronRight size={14} className={cn('text-white/20 transition-transform', isSelected && 'rotate-90')} />
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mb-3">{agent.description}</p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {Object.entries(agent.stats).map(([k, v]) => (
                    <div key={k} className="bg-white/3 rounded-lg p-2 text-center">
                      <div className="text-sm font-semibold text-white font-mono">{v}</div>
                      <div className="text-[10px] text-white/30 leading-tight mt-0.5">{k}</div>
                    </div>
                  ))}
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-white/5 pt-3 mt-1 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Schedule</span>
                      <span className="text-white/60 font-mono">{agent.schedule}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">Env Required</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {agent.envNeeded.map(k => (
                          <span key={k} className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-white/40">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <RunButton agentId={agent.id} status={agent.status} />
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all">
                        <Pause size={12} />
                        Pause
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all">
                        <Settings size={12} />
                        Config
                      </button>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
