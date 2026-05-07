'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { Mail, Zap } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink() {
    if (!email.trim() || loading) return
    setLoading(true)
    try {
      // Calls Supabase signInWithOtp via API route
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-weaver text-2xl font-bold">◈</span>
            <span className="font-semibold text-white">Truth Weaver</span>
            <FrequencyBars size="sm" />
          </div>
          <h1 className="text-2xl font-bold text-white">{sent ? 'Check your email' : 'Sign in'}</h1>
          <p className="text-sm text-white/40 mt-1">
            {sent
              ? `We sent a magic link to ${email}`
              : 'Enter your email to receive a magic link'
            }
          </p>
        </div>

        <GlassCard className="p-6">
          {!sent ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Email address</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-weaver/40 transition-colors">
                  <Mail size={14} className="text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                    placeholder="you@example.com"
                    className="flex-1 bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleMagicLink}
                disabled={!email.trim() || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-weaver text-white font-semibold text-sm hover:bg-weaver-light disabled:bg-white/5 disabled:text-white/20 transition-all"
              >
                {loading ? <Zap size={14} className="animate-pulse" /> : <Mail size={14} />}
                {loading ? 'Sending…' : 'Send magic link'}
              </button>

              <div className="text-center text-xs text-white/30">
                No account yet?{' '}
                <Link href="/pricing" className="text-weaver/70 hover:text-weaver transition-colors">
                  Get access →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-sm text-white/60 leading-relaxed">
                Click the link in your email to sign in. The link expires in 1 hour.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-weaver/60 hover:text-weaver transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
