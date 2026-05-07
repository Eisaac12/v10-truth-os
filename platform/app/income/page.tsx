'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { fmt$$, fmtDate } from '@/lib/utils'
import { TrendingUp, DollarSign, Users, Zap, Package, ExternalLink } from 'lucide-react'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const FADE_UP = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const REVENUE_STREAMS = [
  { name: 'SaaS Subscriptions',    mrr: 2436, subs: 84,  change: +18, status: 'active' },
  { name: 'Digital Products',      mrr: 391,  subs: null, change: +8,  status: 'active' },
  { name: 'Email Nurture Pipeline', mrr: 0,    subs: 124, change: null, status: 'building' },
  { name: 'Twitter Audience',      mrr: 0,    subs: null, change: null, status: 'building' },
  { name: 'AI Agency Services',    mrr: 0,    subs: null, change: null, status: 'planned' },
  { name: 'Affiliate Revenue',     mrr: 0,    subs: null, change: null, status: 'planned' },
]

const RECENT_PAYMENTS = [
  { date: '2026-05-07T14:23:00Z', amount: 99,  plan: 'Visionary', email: 'a***@gmail.com' },
  { date: '2026-05-07T11:41:00Z', amount: 29,  plan: 'Creator',   email: 'm***@icloud.com' },
  { date: '2026-05-07T08:14:00Z', amount: 17,  plan: 'Report',    email: 's***@yahoo.com' },
  { date: '2026-05-06T22:08:00Z', amount: 299, plan: 'Empire',    email: 'j***@outlook.com' },
  { date: '2026-05-06T18:55:00Z', amount: 29,  plan: 'Creator',   email: 'k***@gmail.com' },
]

const FORECAST = [
  { month: 'Jun 2026', mrr: 3200,  subs: 110 },
  { month: 'Jul 2026', mrr: 4100,  subs: 141 },
  { month: 'Aug 2026', mrr: 5300,  subs: 183 },
  { month: 'Sep 2026', mrr: 6800,  subs: 234 },
  { month: 'Dec 2026', mrr: 12000, subs: 414 },
  { month: 'Jun 2027', mrr: 29000, subs: 1000 },
]

const statusVariant: Record<string, 'active' | 'warning' | 'idle'> = {
  active:   'active',
  building: 'warning',
  planned:  'idle'
}

export default function IncomePage() {
  const totalMrr = REVENUE_STREAMS.reduce((t, s) => t + s.mrr, 0)

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" className="max-w-6xl space-y-5">

      {/* Top metrics */}
      <motion.div variants={FADE_UP}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Total MRR"    value={fmt$$(totalMrr)}  sub="↑ 18% vs last month" trend="up" accent />
          <MetricCard label="ARR"          value={fmt$$(totalMrr * 12)} sub="On track for $50K ARR" trend="up" />
          <MetricCard label="Active Subs"  value="84"               sub="3 new today" trend="up" />
          <MetricCard label="Valuation"    value="$164K"            sub="5x ARR multiple" trend="up" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue streams */}
        <motion.div variants={FADE_UP}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-weaver" />
              <span className="text-sm font-semibold text-white">Revenue Streams</span>
            </div>
            <div className="space-y-2">
              {REVENUE_STREAMS.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-medium">{s.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                      {s.subs && <span className="text-xs text-white/30">{s.subs} leads</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-mono font-semibold ${s.mrr > 0 ? 'text-weaver-light' : 'text-white/20'}`}>
                      {s.mrr > 0 ? fmt$$(s.mrr) + '/mo' : '—'}
                    </div>
                    {s.change != null && (
                      <div className="text-xs text-weaver/60">↑ {s.change}%</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent payments */}
        <motion.div variants={FADE_UP}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-weaver" />
                <span className="text-sm font-semibold text-white">Recent Payments</span>
              </div>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener" className="text-xs text-weaver/50 hover:text-weaver flex items-center gap-1">
                Stripe <ExternalLink size={10} />
              </a>
            </div>
            <div className="space-y-1">
              {RECENT_PAYMENTS.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/3 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-weaver/10 flex items-center justify-center text-weaver text-xs font-bold shrink-0">
                    ${p.amount}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 font-medium">{p.plan}</div>
                    <div className="text-xs text-white/30">{p.email}</div>
                  </div>
                  <div className="text-xs text-white/25 shrink-0 font-mono">
                    {fmtDate(p.date)}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Revenue forecast */}
      <motion.div variants={FADE_UP}>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-weaver" />
            <span className="text-sm font-semibold text-white">Revenue Forecast</span>
            <span className="text-xs text-white/30 ml-2">Based on current 18% MoM growth</span>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {FORECAST.map(f => (
              <div key={f.month} className="bg-white/3 rounded-lg p-3 text-center">
                <div className="text-xs text-white/30 mb-1">{f.month}</div>
                <div className="text-base font-semibold font-mono text-weaver-light">{fmt$$(f.mrr)}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{f.subs} subs</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-white/30">6-Month Target</span>
                <div className="text-sm font-semibold text-white mt-0.5">$10K MRR</div>
              </div>
              <div>
                <span className="text-xs text-white/30">12-Month Target</span>
                <div className="text-sm font-semibold text-white mt-0.5">$29K MRR</div>
              </div>
              <div>
                <span className="text-xs text-white/30">Valuation @ 5x ARR</span>
                <div className="text-sm font-semibold text-weaver-light mt-0.5">$1.74M</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-weaver/50" />
              <span className="text-xs text-white/30">1,000 subs → break-even</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Pricing tiers */}
      <motion.div variants={FADE_UP}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { tier: 'Creator',   price: 29,  subs: 52, mrr: 1508, desc: 'Live AI + Truth Weaver' },
            { tier: 'Visionary', price: 99,  subs: 29, mrr: 2871, desc: 'Full Matrix agents' },
            { tier: 'Empire',    price: 299, subs: 3,  mrr:  897, desc: 'Maximum everything' },
          ].map(t => (
            <GlassCard key={t.tier} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{t.tier}</span>
                <span className="text-lg font-bold font-mono text-weaver-light">${t.price}<span className="text-xs text-white/30">/mo</span></span>
              </div>
              <div className="text-xs text-white/40 mb-3">{t.desc}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/3 rounded p-2 text-center">
                  <div className="text-sm font-mono font-semibold text-white">{t.subs}</div>
                  <div className="text-[10px] text-white/30">subscribers</div>
                </div>
                <div className="bg-white/3 rounded p-2 text-center">
                  <div className="text-sm font-mono font-semibold text-weaver-light">{fmt$$(t.mrr)}</div>
                  <div className="text-[10px] text-white/30">MRR</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
