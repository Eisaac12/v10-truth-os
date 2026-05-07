'use client'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean
  glow?: boolean
}

export function GlassCard({ className, hover = false, glow = false, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass rounded-xl',
        hover && 'glass-hover cursor-pointer',
        glow && 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
