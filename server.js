// TRUTHOS Server — Claude API proxy + Telegram bot + morning scheduler
// Run: copy .env.example to .env, fill in keys, then: npm start

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const VOICE_BRIDGE = require('./voice-bridge');
const WEALTH_WEAVER = require('./wealth-weaver');
const { callExpression, fetchNotionContext } = require('./src/expressions');

const app = express();
app.use(cors());
app.use(express.json());

function injectNotionContext(systemPrompt, notionContent) {
    if (!notionContent) return systemPrompt;
    return `${systemPrompt}\n\n---\nNOTION WORKSPACE CONTEXT (live):\n${notionContent}\n---`;
}

// Boot Telegram bot + scheduler (non-fatal — HTTP server still runs without them)
if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
        const { bot } = require('./src/telegram');
        const scheduler = require('./src/scheduler');
        scheduler.init(bot);
    } catch (err) {
        console.warn('[Boot] Telegram/scheduler failed to start:', err.message);
    }
}

// Main activation endpoint
app.post('/api/activate', async (req, res) => {
    const { input } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Input is required.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not set. Add it to your .env file.'
        });
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    try {
        const result = await callExpression(input, 'truthos', history);
        res.json({ success: true, response: result.text, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    } catch (err) {
        console.error('[TRUTHOS] API error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Truth Weaver endpoint — radical honesty, surgical compassion
app.post('/api/truth-weaver', async (req, res) => {
    const { input } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Input is required.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not set. Add it to your .env file.'
        });
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    try {
        const result = await callExpression(input, 'truth-weaver', history);
        res.json({ success: true, response: result.text, agent: 'truth-weaver', frequency: '7.83Hz', inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    } catch (err) {
        console.error('[Truth Weaver] API error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Voice Bridge endpoint — routes to correct expression system prompt
app.post('/api/voice-bridge', async (req, res) => {
    const { input, expression } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Input is required.' });
    }

    const expr = VOICE_BRIDGE.getExpression(expression);
    if (!expr) {
        return res.status(400).json({ success: false, error: `Unknown expression: ${expression}` });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not set. Add it to your .env file.'
        });
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    try {
        const result = await callExpression(input, expression, history);
        res.json({ success: true, response: result.text, agent: expression, expression, expressionName: expr.name, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    } catch (err) {
        console.error(`[Voice Bridge / ${expression}] API error:`, err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Wealth Weaver endpoint — value detection agent
app.post('/api/wealth-weaver', async (req, res) => {
    const { mode = 'scan', preferences, opportunity } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not set. Add it to your .env file.'
        });
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    try {
        const result = await callExpression('', 'wealth-weaver', history, {
            wealthMode: mode,
            opportunity,
            preferences
        });
        res.json({ success: true, response: result.text, mode, agent: 'wealth-weaver', inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    } catch (err) {
        console.error('[Wealth Weaver] API error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'TRUTHOS online',
        ai: process.env.ANTHROPIC_API_KEY ? 'connected' : 'no key set',
        notion: process.env.NOTION_API_KEY ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`⊕ TRUTHOS server running on http://localhost:${PORT}`);
    console.log(`   AI: ${process.env.ANTHROPIC_API_KEY ? 'Claude API connected' : 'No API key — set ANTHROPIC_API_KEY in .env'}`);
});
