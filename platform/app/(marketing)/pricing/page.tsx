'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'creator',
    name: 'Creator',
    price: { monthly: 29, annual: 23 },
    desc: 'Live AI + Truth Weaver + dashboard',
    features: [
      'Live Truth Weaver AI (claude-opus-4-7)',
      'TRUTHOS mode',
      'Conversation memory (20 turns)',
      'Command Center dashboard',
      'Revenue Intelligence',
      'Free local mode included'
    ]
  },
  {
    id: 'visionary',
    name: 'Visionary',
    price: { monthly: 99, annual: 79 },
    desc: 'Full Matrix — all 6 revenue agents',
    featured: true,
    features: [
      'Everything in Creator',
      'All 6 Matrix agents deployed',
      'Twitter Broadcast agent',
      'Email Campaign agent',
      'Outreach Sniper (15 DMs/day)',
      'Content Studio (tweets, threads, newsletters)',
      'Product Generator + Gumroad integration',
      'Priority API processing'
    ]
  },
  {
    id: 'empire',
    name: 'Empire',
    price: { monthly: 299, annual: 239 },
    desc: 'Maximum throughput — build the empire',
    features: [
      'Everything in Visionary',
      'Maximum agent throughput',
      'Unlimited content generation',
      'Full Revenue Matrix automation',
      'Early access to new agents',
      'Dedicated support',
      'Custom agent configuration'
    ]
  }
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  async function checkout(planId: string) {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    }
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <FrequencyBars />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Unlock your frequency
          </h1>
          <p className="text-white/45 max-w-md mx-auto mb-8">
            All plans include local mode free. Upgrade to activate live Claude AI and the full Revenue Matrix.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-lg bg-white/5 border border-white/8">
            <button
              onClick={() => setAnnual(false)}
              className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all', !annual ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2', annual ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
            >
              Annual
              <span className="text-[10px] text-weaver bg-weaver/10 px-1.5 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(({ id, name, price, desc, features, featured }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard
                className={cn(
                  'p-7 h-full flex flex-col',
                  featured && 'border-weaver/40 bg-weaver/3 shadow-[0_0_40px_rgba(16,185,129,0.08)]'
                )}
              >
                {featured && (
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={12} className="text-weaver" />
                    <span className="text-[10px] font-bold text-weaver uppercase tracking-[0.15em]">Most Popular</span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-lg font-semibold text-white">{name}</div>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-bold font-mono text-white">
                      ${annual ? price.annual : price.monthly}
                    </span>
                    <span className="text-white/35 text-sm mb-1">/mo</span>
                  </div>
                  {annual && (
                    <div className="text-xs text-weaver/60 mt-0.5">
                      Billed ${(annual ? price.annual : price.monthly) * 12}/year
                    </div>
                  )}
                  <div className="text-sm text-white/40 mt-2">{desc}</div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <Check size={14} className="text-weaver mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => checkout(id)}
                  className={cn(
                    'w-full py-3.5 rounded-xl text-sm font-semibold transition-all',
                    featured
                      ? 'bg-weaver text-white hover:bg-weaver-light shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'border border-white/12 text-white/70 hover:border-weaver/30 hover:text-white hover:bg-weaver/5'
                  )}
                >
                  Get {name} →
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center space-y-3"
        >
          <p className="text-xs text-white/25">
            Secure checkout via Stripe. Cancel anytime. Free local mode always available.
          </p>
          <div className="flex items-center justify-center gap-8 text-xs text-white/20">
            <span>✓ SSL encrypted</span>
            <span>✓ No hidden fees</span>
            <span>✓ Instant access</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
