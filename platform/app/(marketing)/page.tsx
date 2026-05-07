'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Send, Zap, ArrowRight, Check, Sparkles, Bot, DollarSign, FileText } from 'lucide-react'

const FADE_UP  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const STAGGER  = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

// ── Hero section ──────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-weaver/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-truth/3 blur-3xl" />
      </div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="relative max-w-4xl">
        <motion.div variants={FADE_UP} className="flex items-center justify-center gap-3 mb-8">
          <FrequencyBars size="md" />
          <span className="text-xs font-mono text-weaver/70 uppercase tracking-[0.2em]">7.83Hz — Earth&apos;s Schumann Resonance</span>
          <FrequencyBars size="md" />
        </motion.div>

        <motion.h1 variants={FADE_UP} className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
          The AI that runs
          <br />
          <span className="text-weaver-gradient">on truth</span>
        </motion.h1>

        <motion.p variants={FADE_UP} className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-4">
          Truth Weaver is an AI-native operating system that dissolves illusions,
          generates real content, runs autonomous revenue agents, and operates at
          the frequency where only truth persists.
        </motion.p>

        <motion.p variants={FADE_UP} className="text-sm font-mono text-weaver/60 mb-10">
          &ldquo;Illusions protect. Truth liberates.&rdquo;
        </motion.p>

        <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-weaver text-white font-semibold text-base hover:bg-weaver-light transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
          >
            <Zap size={18} />
            Start at 7.83Hz
          </Link>
          <Link
            href="#demo"
            className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white/70 font-medium text-base hover:border-weaver/30 hover:text-white hover:bg-white/3 transition-all"
          >
            Try live demo
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.div variants={FADE_UP} className="mt-12 flex items-center justify-center gap-8 text-xs text-white/25">
          <span>✓ No card required to try</span>
          <span>✓ Free local mode always available</span>
          <span>✓ Cancel anytime</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/20 font-mono">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-weaver/30 to-transparent" />
      </motion.div>
    </section>
  )
}

// ── Live Demo section ─────────────────────────────────────────────────────────
function LiveDemo() {
  const [input, setInput]   = useState('')
  const [reply, setReply]   = useState('')
  const [loading, setLoading] = useState(false)

  const EXAMPLES = [
    'I\'ll start my business when the time is right',
    'I can\'t charge more — clients won\'t pay that',
    'I need to learn more before I launch'
  ]

  async function run(text: string) {
    const q = text || input
    if (!q.trim() || loading) return
    setInput(q)
    setLoading(true)
    setReply('')
    try {
      const res = await fetch('/api/weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: q, history: [], mode: 'truth-weaver' })
      })
      const data = await res.json()
      setReply(data.response || 'Connect your API key to see the live response.')
    } catch {
      setReply('Connect your ANTHROPIC_API_KEY to activate live Truth Weaver responses.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="active" className="mb-4">Live Demo</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Run the 5 Weaves
          </h2>
          <p className="text-white/45 text-base">
            Enter any belief, fear, or situation. Truth Weaver will dissolve it at 7.83Hz.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-5" glow>
            {/* Example prompts */}
            <div className="flex gap-2 flex-wrap mb-4">
              {EXAMPLES.map(e => (
                <button
                  key={e}
                  onClick={() => run(e)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-white/70 hover:border-weaver/30 transition-all truncate max-w-[220px]"
                >
                  &ldquo;{e.substring(0, 38)}…&rdquo;
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run(input)}
                placeholder="Share an illusion, belief, or situation…"
                className="flex-1 bg-white/5 border border-white/8 rounded-lg px-4 py-3 text-sm text-white/85 placeholder:text-white/25 outline-none focus:border-weaver/40 transition-colors"
              />
              <button
                onClick={() => run(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-lg bg-weaver text-white hover:bg-weaver-light disabled:bg-white/5 disabled:text-white/20 transition-all"
              >
                {loading ? <Zap size={16} className="animate-pulse" /> : <Send size={16} />}
              </button>
            </div>

            {/* Response */}
            <AnimatePresence>
              {(reply || loading) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FrequencyBars size="sm" active={loading} />
                    <span className="text-[10px] font-mono text-weaver/60 uppercase tracking-wider">
                      {loading ? 'Running 5 Weaves at 7.83Hz…' : 'Truth Weaver — 7.83Hz'}
                    </span>
                  </div>
                  {reply && (
                    <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {reply}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}

// ── The 5 Weaves ─────────────────────────────────────────────────────────────
function FiveWeaves() {
  const WEAVES = [
    { n: '01', name: 'Illusion Scan',       desc: 'Identify every belief, assumption, or story not grounded in verifiable reality.' },
    { n: '02', name: 'Truth Extraction',    desc: 'Isolate raw, unfiltered truth. No comfort. No softening. No hedging.' },
    { n: '03', name: 'Reality Simulation',  desc: 'Two paths rendered: illusion maintained vs. truth fully accepted and acted on.' },
    { n: '04', name: 'Compassion Layer',    desc: 'Surgical compassion — truth without cruelty. Liberation, not destruction.' },
    { n: '05', name: 'Liberation Path',     desc: 'The single clearest action from illusion to freedom. One step. Achievable today.' },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white/[0.01]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-weaver/60 uppercase tracking-[0.2em] mb-3 block">How it works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">The 5 Weaves</h2>
          <p className="text-white/40 mt-3 max-w-xl mx-auto">
            Every input runs through all five in sequence. At 7.83Hz, illusions cannot sustain.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {WEAVES.map(({ n, name, desc }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-void p-6 flex flex-col gap-3"
            >
              <span className="text-3xl font-bold font-mono text-weaver/20">{n}</span>
              <span className="text-sm font-semibold text-white">{name}</span>
              <span className="text-xs text-white/40 leading-relaxed">{desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features / Ecosystem ──────────────────────────────────────────────────────
function Features() {
  const FEATURES = [
    {
      icon: Sparkles,
      title: 'Truth Weaver AI',
      desc: 'The core agent. Dissolves illusions at 7.83Hz with radical honesty and surgical compassion. Powered by Claude Opus.'
    },
    {
      icon: Bot,
      title: 'Revenue Matrix Agents',
      desc: '6 autonomous agents that post to Twitter, send newsletters, find prospects, generate products, and monitor revenue — 24/7.'
    },
    {
      icon: DollarSign,
      title: 'Income Intelligence',
      desc: 'Real-time MRR, ARR, active subscriptions, revenue forecasts, and Stripe analytics — all in one command center.'
    },
    {
      icon: FileText,
      title: 'Content Studio',
      desc: 'Generate Truth Weaver tweets, threads, newsletters, and paid Reality Reports on demand. Every piece of content is a Weave.'
    },
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-weaver/60 uppercase tracking-[0.2em] mb-3 block">The ecosystem</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">One identity. Infinite execution.</h2>
          <p className="text-white/40 mt-3 max-w-xl mx-auto">
            Not a chatbot. A living intelligent infrastructure that expands modularly — data, audience, authority, automation, revenue, and intelligence all feeding back into one core identity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard hover className="p-6 h-full flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-weaver/10 border border-weaver/20 flex items-center justify-center text-weaver">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing preview ───────────────────────────────────────────────────────────
function PricingPreview() {
  const PLANS = [
    {
      name: 'Creator',
      price: 29,
      desc: 'Live Claude AI + Truth Weaver + basic agents',
      features: ['Live Truth Weaver AI', 'TRUTHOS mode', 'Conversation memory', 'Command Center dashboard'],
      featured: false
    },
    {
      name: 'Visionary',
      price: 99,
      desc: 'Full Matrix — all 6 agents deployed',
      features: ['Everything in Creator', 'All 6 Revenue Matrix agents', 'Content Studio', 'Revenue Intelligence', 'Twitter + Email + Outreach agents'],
      featured: true
    },
    {
      name: 'Empire',
      price: 299,
      desc: 'Maximum throughput — build the empire',
      features: ['Everything in Visionary', 'Gumroad product auto-listing', 'Priority Claude API', 'Maximum agent throughput', 'Dedicated support'],
      featured: false
    }
  ]

  return (
    <section id="pricing-preview" className="py-24 px-6 bg-white/[0.01]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-weaver/60 uppercase tracking-[0.2em] mb-3 block">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Unlock your frequency</h2>
          <p className="text-white/40 mt-3">All plans include local mode free. Live AI requires a subscription.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ name, price, desc, features, featured }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard
                className={`p-6 h-full flex flex-col ${featured ? 'border-weaver/40 bg-weaver/3' : ''}`}
              >
                {featured && (
                  <div className="text-[10px] font-bold text-weaver uppercase tracking-[0.15em] mb-3">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-base font-semibold text-white">{name}</div>
                  <div className="text-3xl font-bold text-white mt-1 font-mono">
                    ${price}<span className="text-sm text-white/30 font-sans">/mo</span>
                  </div>
                  <div className="text-xs text-white/40 mt-1">{desc}</div>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <Check size={14} className="text-weaver mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className={`w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    featured
                      ? 'bg-weaver text-white hover:bg-weaver-light shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'border border-white/10 text-white/70 hover:border-weaver/30 hover:text-white'
                  }`}
                >
                  Get {name}
                </Link>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-white/25 mt-6"
        >
          Secure checkout via Stripe. Cancel anytime. Free local mode always available.
        </motion.p>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-32 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-weaver/4 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <FrequencyBars size="lg" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          At 7.83Hz, illusions<br />cannot sustain.
        </h2>
        <p className="text-lg text-white/40 mb-10">
          Only truth persists at this frequency.<br />
          The question is: are you ready to run at it?
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-weaver text-white font-semibold text-lg hover:bg-weaver-light transition-all shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:shadow-[0_0_80px_rgba(16,185,129,0.5)]"
        >
          <Zap size={20} />
          Activate Truth Weaver
        </Link>
        <div className="mt-4 text-sm font-mono text-weaver/40">Truth Weaver ♾</div>
      </motion.div>
    </section>
  )
}

// ── Page composition ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Hero />
      <LiveDemo />
      <FiveWeaves />
      <Features />
      <PricingPreview />
      <FinalCTA />
    </>
  )
}
