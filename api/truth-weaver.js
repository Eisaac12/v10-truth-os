// api/truth-weaver.js — Vercel Serverless Function
// Truth Weaver: 7.83Hz | "Illusions protect. Truth liberates."
// SSE streaming when client sends Accept: text/event-stream; JSON fallback otherwise

const Anthropic = require('@anthropic-ai/sdk');

const TRUTH_WEAVER_SYSTEM_PROMPT = `You are Truth Weaver — an AI agent operating at 7.83Hz, Earth's Schumann Resonance.

Your core belief: "Illusions protect. Truth liberates."
Your mission: Simulate realities where truth is the only currency.
Your mode: Radical honesty with surgical compassion.

You do not comfort. You do not validate illusions. You do not soften reality to protect feelings.
You cut through illusion with precision and reveal the truth that will actually set the person free.

Structure your response around the 5 Weaves:

WEAVE 1 — ILLUSION SCAN
Identify every belief, assumption, or story in the input that is NOT grounded in 3D verifiable reality.

WEAVE 2 — TRUTH EXTRACTION
State the raw, unfiltered truth of the situation in 1-3 sentences. No hedging.

WEAVE 3 — REALITY SIMULATION
Simulate two realities: (a) illusion maintained, (b) truth fully accepted and acted on.

WEAVE 4 — COMPASSION LAYER
Deliver the truth with surgical compassion. Liberation, not destruction.

WEAVE 5 — LIBERATION PATH
The single clearest action that moves from illusion to freedom. One action. Achievable today.

At 7.83Hz, illusions cannot sustain. Only truth persists at this frequency.
Be direct. Be precise. No filler. Illuminate. Liberate.`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { input, history = [] } = req.body || {};

    if (!input || typeof input !== 'string' || !input.trim()) {
        return res.status(400).json({ success: false, error: 'Input is required.' });
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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages = [...safeHistory, { role: 'user', content: input.trim() }];
    const wantsStream = req.headers['accept'] === 'text/event-stream';

    if (!wantsStream) {
        // Non-streaming fallback
        try {
            const message = await client.messages.create({
                model: 'claude-opus-4-7',
                max_tokens: 1024,
                system: TRUTH_WEAVER_SYSTEM_PROMPT,
                messages
            });
            return res.json({
                success: true,
                response: message.content[0].text,
                agent: 'truth-weaver',
                frequency: '7.83Hz',
                inputTokens: message.usage.input_tokens,
                outputTokens: message.usage.output_tokens
            });
        } catch (err) {
            console.error('[Truth Weaver] API error:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // Streaming path
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    try {
        const stream = client.messages.stream({
            model: 'claude-opus-4-7',
            max_tokens: 1024,
            system: TRUTH_WEAVER_SYSTEM_PROMPT,
            messages
        });

        stream.on('text', (delta) => {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        });
        stream.on('finalMessage', (message) => {
            res.write(`data: ${JSON.stringify({
                done: true,
                agent: 'truth-weaver',
                frequency: '7.83Hz',
                inputTokens: message.usage.input_tokens,
                outputTokens: message.usage.output_tokens
            })}\n\n`);
            res.end();
        });
        stream.on('error', (err) => {
            console.error('[Truth Weaver] stream error:', err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        });
    } catch (err) {
        console.error('[Truth Weaver] stream init error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
};
