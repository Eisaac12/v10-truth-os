// api/health.js — Vercel Serverless Function

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
        status: 'TRUTHOS online',
        ai: process.env.ANTHROPIC_API_KEY ? 'connected' : 'no key set',
        timestamp: new Date().toISOString()
    });
};
