// api/checkout.js — Stripe Checkout Session creator
// Creates a hosted checkout session for a subscription tier.
// Required env vars: STRIPE_SECRET_KEY, STRIPE_PRICE_ID_CREATOR,
//                    STRIPE_PRICE_ID_VISIONARY, STRIPE_PRICE_ID_EMPIRE

const Stripe = require('stripe');

const PRICE_IDS = {
    creator:   process.env.STRIPE_PRICE_ID_CREATOR,
    visionary: process.env.STRIPE_PRICE_ID_VISIONARY,
    empire:    process.env.STRIPE_PRICE_ID_EMPIRE
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
    }

    const { tier = 'creator' } = req.body || {};
    const priceId = PRICE_IDS[tier];

    if (!priceId) {
        return res.status(400).json({ error: `Unknown tier "${tier}". Valid: creator, visionary, empire` });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // Build the success URL — the app handles ?session_id= on load
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://your-app.vercel.app';

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}?checkout=cancelled`,
            allow_promotion_codes: true
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[checkout] Stripe error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
