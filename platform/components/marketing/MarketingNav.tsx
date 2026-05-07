'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { FrequencyBars } from '@/components/ui/FrequencyBars'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features',     label: 'Features' },
  { href: '/pricing',       label: 'Pricing' },
  { href: '/demo',          label: 'Live demo' },
]

export function MarketingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-12 border-b border-white/5 bg-void/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mr-10">
        <div className="w-8 h-8 rounded-lg bg-weaver/10 border border-weaver/20 flex items-center justify-center text-weaver font-bold">
          ◈
        </div>
        <span className="font-semibold text-white text-sm tracking-wide">Truth Weaver</span>
        <FrequencyBars size="sm" />
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/90 rounded-lg hover:bg-white/5 transition-all"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* CTA */}
      <div className="flex items-center gap-3 ml-auto">
        <Link
          href="/auth/sign-in"
          className="text-sm text-white/50 hover:text-white/80 transition-colors px-3 py-2"
        >
          Sign in
        </Link>
        <Link
          href="/pricing"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-weaver text-white text-sm font-semibold hover:bg-weaver-light transition-colors shadow-[0_0_16px_rgba(16,185,129,0.3)]"
        >
          Get access
        </Link>
      </div>
    </motion.header>
  )
}
