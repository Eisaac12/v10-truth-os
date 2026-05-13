// api/voice-bridge.js — Vercel Serverless Function
// Voice Bridge: ONE IDENTITY. MANY EXPRESSIONS.
// Routes to the correct expression system prompt based on `expression` in body.

const Anthropic = require('@anthropic-ai/sdk');
const VOICE_BRIDGE = require('../voice-bridge');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { input, expression, history = [] } = req.body || {};

    if (!input || typeof input !== 'string' || !input.trim()) {
        return res.status(400).json({ success: false, error: 'Input is required.' });
    }

    const expr = VOICE_BRIDGE.getExpression(expression);
    if (!expr) {
        return res.status(400).json({ success: false, error: `Unknown expression: ${expression}` });
    }

    const systemPrompt = VOICE_BRIDGE.systemPrompts[expression];
    if (!systemPrompt) {
        return res.status(400).json({ success: false, error: `No system prompt for expression: ${expression}` });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not set. Add it in your Vercel project settings under Environment Variables.'
        });
    }

    const safeHistory = Array.isArray(history)
        ? history
            .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .slice(-20)
        : [];

    try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const message = await client.messages.create({
            model: 'claude-opus-4-7',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [...safeHistory, { role: 'user', content: input.trim() }]
        });

        res.json({
            success: true,
            response: message.content[0].text,
            agent: expression,
            expression,
            expressionName: expr.name,
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens
        });
    } catch (err) {
        console.error(`[Voice Bridge / ${expression}] API error:`, err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
