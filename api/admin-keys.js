// api/admin-keys.js — Vercel Serverless Function
// Returns sanitized list of Anthropic API keys via Admin API
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
        const r = await fetch('https://api.anthropic.com/v1/organizations/api_keys', {
            headers: {
                'X-Api-Key': process.env.ANTHROPIC_ADMIN_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });
        if (!r.ok) throw new Error(`Admin API ${r.status}: ${await r.text()}`);
        const data = await r.json();
        const keys = (data.data || []).map(k => ({
            id: k.id,
            name: k.name,
            created_at: k.created_at,
            last_used_at: k.last_used_at,
            status: k.status
        }));
        res.json({ keys });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
