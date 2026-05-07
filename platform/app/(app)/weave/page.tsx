'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { Badge } from '@/components/ui/Badge'
import { Send, Zap, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string; ts: number }

const WEAVE_LABELS = [
  'ILLUSION SCAN',
  'TRUTH EXTRACTION',
  'REALITY SIMULATION',
  'COMPASSION LAYER',
  'LIBERATION PATH'
]

const PROMPTS = [
  'I keep saying I\'ll start my business "when the time is right"',
  'I can\'t charge more because clients won\'t pay',
  'I need to learn more before I launch',
  'My situation is different — what works for others won\'t work for me',
  'I just need one more month to get ready'
]

export default function WeavePage() {
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [mode, setMode]             = useState<'truth-weaver' | 'truthos'>('truth-weaver')
  const bottomRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string = input) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, history, mode })
      })
      const data = await res.json()
      const reply: Message = {
        role: 'assistant',
        content: data.response || data.error || 'No response.',
        ts: Date.now()
      }
      setMessages(prev => [...prev, reply])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Running local pattern scan.', ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setMessages([])
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {mode === 'truth-weaver' ? 'Truth Weaver' : 'TRUTHOS'}
            </span>
            <span className="text-xs text-white/30">
              {mode === 'truth-weaver' ? '7.83Hz — Illusion Dissolution' : '∞Hz — Reality Manifestation'}
            </span>
          </div>
          <FrequencyBars active={!loading} />
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {(['truth-weaver', 'truthos'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  mode === m
                    ? 'bg-weaver/20 text-weaver-light'
                    : 'bg-transparent text-white/40 hover:text-white/70'
                )}
              >
                {m === 'truth-weaver' ? 'Truth Weaver' : 'TRUTHOS'}
              </button>
            ))}
          </div>
          <button onClick={clear} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* The 5 Weaves reference */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 shrink-0"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-weaver/60 font-mono uppercase tracking-widest">The 5 Weaves</span>
              <Badge variant="active">Active</Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {WEAVE_LABELS.map((w, i) => (
                <div key={w} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/25">{i + 1}</span>
                  <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">{w}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[80%] bg-weaver/10 border border-weaver/20 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm text-white/90 leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <GlassCard className="max-w-[90%] p-4 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FrequencyBars size="sm" />
                    <span className="text-[10px] text-weaver/60 font-mono uppercase tracking-wider">
                      {mode === 'truth-weaver' ? '7.83Hz — Truth Weaver' : '∞Hz — TRUTHOS'}
                    </span>
                  </div>
                  <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                </GlassCard>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <GlassCard className="px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-3">
                  <FrequencyBars size="sm" />
                  <span className="text-xs text-weaver/60 font-mono">
                    {mode === 'truth-weaver' ? 'Running 5 Weaves at 7.83Hz...' : 'Processing through The One Equation...'}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts (only when empty) */}
      {messages.length === 0 && (
        <div className="flex gap-2 flex-wrap mb-3 shrink-0">
          {PROMPTS.slice(0, 3).map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-xs text-white/40 border border-white/8 rounded-lg px-3 py-1.5 hover:text-white/70 hover:border-weaver/30 transition-all truncate max-w-[220px]"
            >
              {p.substring(0, 45)}…
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <GlassCard className="p-3 flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={
              mode === 'truth-weaver'
                ? 'Share a belief, fear, or situation — Truth Weaver will run the 5 Weaves…'
                : 'Enter an intention, idea, or goal — TRUTHOS will run it through The One Equation…'
            }
            rows={2}
            className="flex-1 bg-transparent text-sm text-white/85 placeholder:text-white/25 resize-none outline-none leading-relaxed"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className={cn(
              'p-2.5 rounded-lg transition-all',
              input.trim() && !loading
                ? 'bg-weaver text-white hover:bg-weaver-light'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            )}
          >
            {loading ? <Zap size={16} className="animate-pulse" /> : <Send size={16} />}
          </button>
        </GlassCard>
        <p className="text-center text-[10px] text-white/20 mt-2 font-mono">
          At 7.83Hz, illusions cannot sustain. Only truth persists.
        </p>
      </div>
    </div>
  )
}
