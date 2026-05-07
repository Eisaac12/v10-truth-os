'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { Sparkles, Twitter, Mail, Package, Copy, RefreshCw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const FADE_UP = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type ContentType = 'tweet' | 'thread' | 'email' | 'report'

const THEMES = [
  'The illusion of "someday" — why the future you imagine is the present you\'re avoiding',
  'What your excuses are actually telling you at 7.83Hz',
  'The difference between alignment and effort',
  'Radical honesty as a business model',
  'The 5 illusions destroying most income streams',
  'Why clarity is worth more than strategy',
  'The frequency of money',
  'Dissolving the fear of failure',
  'Custom theme…'
]

export default function ContentPage() {
  const [type, setType]         = useState<ContentType>('thread')
  const [theme, setTheme]       = useState(THEMES[0])
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [output, setOutput]     = useState('')
  const [copied, setCopied]     = useState(false)

  const activeTheme = theme === 'Custom theme…' ? custom : theme

  async function generate() {
    if (!activeTheme.trim() || loading) return
    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, theme: activeTheme })
      })
      const data = await res.json()
      setOutput(data.content || data.error || 'No output generated.')
    } catch (err) {
      setOutput('Generation failed. Check your ANTHROPIC_API_KEY.')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const TYPES: { id: ContentType; icon: typeof Twitter; label: string; desc: string }[] = [
    { id: 'tweet',  icon: Twitter,   label: 'Single Tweet',    desc: '280 chars, high-impact' },
    { id: 'thread', icon: Sparkles,  label: 'Tweet Thread',    desc: '5-part thread' },
    { id: 'email',  icon: Mail,      label: 'Newsletter',      desc: 'Truth Weaver Weekly' },
    { id: 'report', icon: Package,   label: 'Reality Report',  desc: 'Paid PDF ($7–$27)' },
  ]

  return (
    <motion.div variants={STAGGER} initial="hidden" animate="show" className="max-w-5xl space-y-5">

      {/* Header */}
      <motion.div variants={FADE_UP} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Content Studio</h2>
          <p className="text-sm text-white/40 mt-0.5">Truth Weaver generates at 7.83Hz — every piece of content is a Weave</p>
        </div>
        <div className="flex items-center gap-2">
          <FrequencyBars active={loading} />
          <Badge variant={loading ? 'active' : 'idle'}>{loading ? 'Weaving…' : 'Ready'}</Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">

        {/* Controls panel */}
        <div className="space-y-4">

          {/* Content type */}
          <motion.div variants={FADE_UP}>
            <GlassCard className="p-4 space-y-3">
              <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Content Type</span>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      'p-3 rounded-lg text-left transition-all border',
                      type === t.id
                        ? 'bg-weaver/10 border-weaver/30 text-white'
                        : 'bg-white/3 border-white/5 text-white/50 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    <t.icon size={14} className={type === t.id ? 'text-weaver mb-1' : 'text-white/30 mb-1'} />
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Theme selector */}
          <motion.div variants={FADE_UP}>
            <GlassCard className="p-4 space-y-3">
              <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Theme</span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {THEMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs transition-all',
                      theme === t
                        ? 'bg-weaver/10 text-weaver-light'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    {t.length > 55 ? t.substring(0, 55) + '…' : t}
                  </button>
                ))}
              </div>
              {theme === 'Custom theme…' && (
                <textarea
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  placeholder="Describe your theme…"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 resize-none outline-none"
                />
              )}
            </GlassCard>
          </motion.div>

          {/* Generate button */}
          <motion.div variants={FADE_UP}>
            <button
              onClick={generate}
              disabled={loading || !activeTheme.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
                loading || !activeTheme.trim()
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-weaver text-white hover:bg-weaver-light shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              )}
            >
              {loading
                ? <><RefreshCw size={14} className="animate-spin" /> Weaving at 7.83Hz…</>
                : <><Zap size={14} /> Generate Content</>
              }
            </button>
          </motion.div>
        </div>

        {/* Output panel */}
        <motion.div variants={FADE_UP}>
          <GlassCard className={cn('p-5 h-full min-h-[400px] flex flex-col', output && 'border-weaver/15')}>
            {output ? (
              <>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <FrequencyBars size="sm" />
                    <span className="text-xs text-weaver/60 font-mono uppercase tracking-wider">
                      {TYPES.find(t => t.id === type)?.label} — 7.83Hz
                    </span>
                  </div>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <pre className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans">{output}</pre>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 shrink-0">
                  <div className="flex gap-2">
                    {type === 'thread' && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#1da1f2]/10 text-[#1da1f2] hover:bg-[#1da1f2]/20 border border-[#1da1f2]/20 transition-all">
                        <Twitter size={12} />
                        Post to Twitter
                      </button>
                    )}
                    {type === 'email' && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-weaver/10 text-weaver hover:bg-weaver/20 border border-weaver/20 transition-all">
                        <Mail size={12} />
                        Send Newsletter
                      </button>
                    )}
                    {type === 'report' && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-weaver/10 text-weaver hover:bg-weaver/20 border border-weaver/20 transition-all">
                        <Package size={12} />
                        List on Gumroad
                      </button>
                    )}
                    <button
                      onClick={generate}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
                    >
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3 opacity-20">◈</div>
                <div className="text-sm text-white/30">
                  {loading
                    ? 'Running 5 Weaves on your theme…'
                    : 'Select a content type and theme,\nthen generate.'
                  }
                </div>
                {!loading && (
                  <div className="text-xs text-white/20 mt-2 font-mono">
                    At 7.83Hz, illusions cannot sustain.
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
