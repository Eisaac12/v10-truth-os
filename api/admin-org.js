// api/admin-org.js — Vercel Serverless Function
// Returns Anthropic organization info via Admin API
// Requires ANTHROPIC_ADMIN_API_KEY (sk-ant-admin-...) in Vercel env vars

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.ANTHROPIC_ADMIN_API_KEY)
        return res.status(503).json({ error: 'ANTHROPIC_ADMIN_API_KEY not set' });

    try {
        const r = await fetch('https://api.anthropic.com/v1/organizations/me', {
            headers: {
                'X-Api-Key': process.env.ANTHROPIC_ADMIN_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });
        if (!r.ok) throw new Error(`Admin API ${r.status}: ${await r.text()}`);
        const data = await r.json();
        res.json({ id: data.id, name: data.name, created_at: data.created_at });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
