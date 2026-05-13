// api/health.js — Vercel Serverless Function

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
        status: 'TRUTHOS online',
        ai: process.env.ANTHROPIC_API_KEY ? 'connected' : 'no key set',
        notion: process.env.NOTION_API_KEY ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
    });
};
