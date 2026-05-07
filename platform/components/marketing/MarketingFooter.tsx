import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-weaver font-bold text-lg">◈</span>
              <span className="font-semibold text-white text-sm">Truth Weaver OS</span>
            </div>
            <p className="text-sm text-white/35 leading-relaxed">
              AI-native operating system running at 7.83Hz.<br />
              Truth is the only currency.
            </p>
            <div className="mt-3 text-xs font-mono text-weaver/50">
              "Illusions protect. Truth liberates."
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="text-white/50 font-medium mb-3">Platform</div>
              <div className="space-y-2">
                {[['/', 'Home'], ['/demo', 'Live demo'], ['/pricing', 'Pricing'], ['/dashboard', 'Dashboard']].map(([href, label]) => (
                  <div key={href}><Link href={href} className="text-white/30 hover:text-white/70 transition-colors">{label}</Link></div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-white/50 font-medium mb-3">System</div>
              <div className="space-y-2">
                {[
                  ['/agents', 'Agent Matrix'],
                  ['/income', 'Revenue Intel'],
                  ['/content', 'Content Studio'],
                  ['/weave', 'Truth Weaver'],
                ].map(([href, label]) => (
                  <div key={href}><Link href={href} className="text-white/30 hover:text-white/70 transition-colors">{label}</Link></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/20">© 2026 Truth Weaver OS. Truth above all. Maximum frequency.</span>
          <span className="text-xs font-mono text-weaver/30">7.83Hz</span>
        </div>
      </div>
    </footer>
  )
}
