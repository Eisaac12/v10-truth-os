// api/verify-license.js — Validate a Stripe Checkout Session after payment
// GET /api/verify-license?session_id=cs_xxx
// Returns: { valid, customerId, plan }

const Stripe = require('stripe');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
    }

    const { session_id } = req.query;
    if (!session_id || !session_id.startsWith('cs_')) {
        return res.status(400).json({ valid: false, error: 'Invalid session_id.' });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['subscription']
        });

        if (session.payment_status !== 'paid' && session.status !== 'complete') {
            return res.json({ valid: false, error: 'Payment not completed.' });
        }

        const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;

        // Derive plan from the subscription's price lookup key or amount
        let plan = 'creator';
        const sub = session.subscription;
        if (sub && sub.items?.data?.[0]) {
            const amount = sub.items.data[0].price?.unit_amount;
            if (amount >= 29900) plan = 'empire';
            else if (amount >= 9900) plan = 'visionary';
            else plan = 'creator';
        }

        res.json({ valid: true, customerId, plan });
    } catch (err) {
        console.error('[verify-license] Stripe error:', err.message);
        res.status(500).json({ valid: false, error: err.message });
    }
};
