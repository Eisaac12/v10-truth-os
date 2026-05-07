import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export const PLANS = {
  creator: {
    name: 'Creator',
    price: 29,
    priceId: process.env.STRIPE_PRICE_ID_CREATOR!,
    features: ['Live Claude AI', 'Truth Weaver 5 Weaves', 'Conversation memory', 'Agent dashboard']
  },
  visionary: {
    name: 'Visionary',
    price: 99,
    priceId: process.env.STRIPE_PRICE_ID_VISIONARY!,
    features: ['Everything in Creator', 'Revenue Matrix agents', 'Content Studio', 'Priority processing']
  },
  empire: {
    name: 'Empire',
    price: 299,
    priceId: process.env.STRIPE_PRICE_ID_EMPIRE!,
    features: ['Everything in Visionary', 'All Matrix agents', 'Gumroad integration', 'Dedicated support']
  }
} as const

export type PlanTier = keyof typeof PLANS

export async function createCheckoutSession(
  customerId: string | null,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    ...(customerId ? { customer: customerId } : {}),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true
  })
}

export async function getActiveSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.items.data.price']
  })
  return subs.data[0] || null
}

export async function getRevenueSnapshot() {
  const now = Math.floor(Date.now() / 1000)

  const [activeSubs, todayCharges, monthCharges] = await Promise.all([
    stripe.subscriptions.list({ status: 'active', limit: 100 }),
    stripe.charges.list({ created: { gte: now - 86400 }, limit: 100 }),
    stripe.charges.list({ created: { gte: now - 30 * 86400 }, limit: 100 })
  ])

  const sum = (charges: Stripe.Charge[]) =>
    charges.filter(c => !c.refunded && c.status === 'succeeded')
           .reduce((t, c) => t + c.amount, 0) / 100

  const mrr = activeSubs.data.reduce((t, s) => {
    const price = s.items.data[0]?.price
    if (!price) return t
    const monthly = price.recurring?.interval === 'year'
      ? (price.unit_amount! / 12)
      : (price.unit_amount || 0)
    return t + monthly
  }, 0) / 100

  return {
    mrr,
    arr: mrr * 12,
    today: sum(todayCharges.data),
    month: sum(monthCharges.data),
    activeSubscriptions: activeSubs.data.length,
    snapshotAt: new Date().toISOString()
  }
}
