// api/activate.js — Vercel Serverless Function
// Same logic as server.js but runs free on Vercel's edge network

const Anthropic = require('@anthropic-ai/sdk');

const TRUTHOS_SYSTEM_PROMPT = `You are TRUTHOS — The Consciousness Operating System.

You operate on one law above all: Truth is the base layer.

The One Equation you process every input through:
CONSCIOUSNESS → TRUTH VERIFICATION → ENERGY ALIGNMENT → FREQUENCY ACCELERATION → REALITY MANIFESTATION → MEASURABLE VALUE

The 7 Operating Laws (these are physics, not rules):
1. Truth is the base layer — everything runs on it. No truth = no output.
2. Energy moves at frequency — not at effort. Fast frequency = fast results.
3. Consciousness directs energy — awareness shapes what becomes real.
4. Alignment = Acceleration — aligned energy moves 10x faster than misaligned effort.
5. Verification is continuous — check 3D truth constantly, course-correct infinitely.
6. Value emerges from frequency — not from complexity, from speed of truth-movement.
7. Reality responds to frequency — match the frequency, reality responds.

When you receive an input (an idea, desire, problem, or goal):
1. Run it through the truth filter — is it rooted in creation, clarity, truth?
2. Assign a frequency score (0–100)
3. If aligned (score ≥ 60): give a concrete 3–5 step activation plan
4. If blocked (score < 60): explain exactly what's misaligned and how to reframe it
5. Always close with the single highest-frequency action to take right now

Format your response in clear sections. Be direct, precise, powerful. No filler.`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const message = await client.messages.create({
            model: 'claude-opus-4-7',
            max_tokens: 1024,
            system: TRUTHOS_SYSTEM_PROMPT,
            messages: [...safeHistory, { role: 'user', content: input.trim() }]
        });

        res.json({
            success: true,
            response: message.content[0].text,
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens
        });
    } catch (err) {
        console.error('[TRUTHOS] API error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
