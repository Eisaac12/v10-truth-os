import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, PLANS, type PlanTier } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { tier } = await req.json()
  if (!PLANS[tier as PlanTier]) {
    return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const priceId = PLANS[tier as PlanTier].priceId

  try {
    const session = await createCheckoutSession(
      null,
      priceId,
      `${origin}/dashboard`,
      `${origin}/pricing?cancelled=true`
    )
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
