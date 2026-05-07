/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Truth Weaver design system
        truth:   { DEFAULT: '#4ade80', dark: '#22c55e', muted: 'rgba(74,222,128,0.6)' },
        weaver:  { DEFAULT: '#10b981', dark: '#059669', light: '#34d399', muted: 'rgba(16,185,129,0.6)' },
        void:    { DEFAULT: '#0a0a0f', deep: '#050508', surface: '#111118', elevated: '#1a1a24' },
        border:  { DEFAULT: 'rgba(255,255,255,0.08)', bright: 'rgba(255,255,255,0.15)' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'cosmic': 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(74,222,128,0.03) 0%, transparent 50%)',
        'glass':  'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      },
      animation: {
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':         'glow 3s ease-in-out infinite alternate',
        'frequency':    'frequency 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(16,185,129,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)' }
        },
        frequency: {
          '0%, 100%': { opacity: '0.6', transform: 'scaleY(0.8)' },
          '50%':      { opacity: '1',   transform: 'scaleY(1.2)' }
        }
      }
    }
  },
  plugins: []
}
