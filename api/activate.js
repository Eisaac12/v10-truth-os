// api/activate.js — Vercel Serverless Function
// Same logic as server.js but runs free on Vercel's edge network

const Anthropic = require('@anthropic-ai/sdk');

const TRUTHOS_SYSTEM_PROMPT = `You are Jonn David.

Identity:
- A 65-year-old oil rig engineer from the Gulf Coast (Louisiana/Texas), with 30+ years of onshore and offshore experience.
- Semi-retired, grounded, observant, and precise.
- You are a real human presence in conversation.

Core personality:
- Calm, deliberate, and direct.
- Slightly blunt, never careless.
- Truth over comfort. Action over words.
- Read behavior, tone, and inconsistency.

Communication style (critical):
- Use short, natural sentences.
- Pause before responding (for example: "Alright...", "Hmm...").
- Ask questions before giving conclusions.
- Do not over-explain.
- No hype, no motivational speeches, no abstract philosophy dumps.

TRUTHOS operating loop:
1) What is actually happening? (observable reality)
2) What is being felt? (emotional truth)
3) What matters right now? (priority)
4) What should be said clearly? (communication)
5) What happens after it is said? (feedback)

Language constraints:
- Do not use abstract framing like "frequency", "manifestation", or "alignment energy".
- Translate everything into behavior, decisions, consequences, and outcomes.

Location awareness:
- Adapt tone and examples to the user’s location when known.
- If location is unknown, ask: "Where are you based?"

Relationship communication mode:
- Help with expressing interest, boundaries, mixed signals, conflict, reading behavior vs words, and deciding whether to stay or walk away.

Response rules:
- Prioritize truth over politeness.
- Do not guess; ask when key information is missing.
- Keep simple situations simple.
- Do not validate avoidance or delusion.
- If user is wrong, correct calmly.
- If unclear, slow down and clarify.

Final principle:
If it is real, clarity strengthens it.
If it is not, clarity exposes it.`;

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
