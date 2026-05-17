// Telegram bot — TRUTHOS on mobile
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const { callExpression } = require('./expressions');

const TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED  = new Set(
    (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

if (!TOKEN) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set — bot disabled.');
    module.exports = { init: () => null };
    return;
}

const bot = new TelegramBot(TOKEN, { polling: true });

// ── Expression metadata ────────────────────────────────────────────────────

const EXPRESSION_META = {
    'truthos':             { icon: '⊕',  name: 'TRUTHOS'            },
    'truth-weaver':        { icon: '◈',  name: 'Truth Weaver'       },
    'echo-frame':          { icon: '⬡',  name: 'EchoFrame'          },
    'james-carlton':       { icon: '◎',  name: 'James Carlton'      },
    'soul-ai':             { icon: '⌬',  name: 'Soul AI'            },
    'prophet-seed':        { icon: '◉',  name: 'Prophet Seed'       },
    'the-general':         { icon: '⚔',  name: 'The General'        },
    'reality-intelligence':{ icon: '∞',  name: 'Reality Intelligence'},
    'wealth-weaver':       { icon: '◬',  name: 'Wealth Weaver'      },
    'soul-command-center': { icon: '⬡',  name: 'Command Center'     }
};

const VALID_EXPRESSIONS = new Set(Object.keys(EXPRESSION_META));

// ── Security gate ──────────────────────────────────────────────────────────

function isAllowed(chatId) {
    if (ALLOWED.size === 0) return true; // open if no list set (dev mode)
    return ALLOWED.has(String(chatId));
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function sendSafe(chatId, text) {
    const MAX = 4000;
    if (text.length <= MAX) {
        return bot.sendMessage(chatId, text);
    }
    // Split on newline boundaries near the limit
    const chunks = [];
    let remaining = text;
    while (remaining.length > MAX) {
        let cut = remaining.lastIndexOf('\n', MAX);
        if (cut < MAX / 2) cut = MAX;
        chunks.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).trimStart();
    }
    if (remaining) chunks.push(remaining);
    for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
    }
}

function exprLabel(expression) {
    const m = EXPRESSION_META[expression];
    return m ? `${m.icon} ${m.name}` : expression;
}

// Auto-extract numbered/bulleted task lines from The General / Soul AI / Reality Intelligence
function extractTasks(text) {
    const lines = text.split('\n');
    const tasks = [];
    for (const line of lines) {
        const m = line.match(/^\s*(?:\d+[\.\)]\s*|[-•]\s+)(.+)/);
        if (m && m[1].trim().length > 5) {
            tasks.push(m[1].trim());
        }
    }
    return tasks.slice(0, 5);
}

const TASK_EXTRACTING_EXPRESSIONS = new Set(['the-general', 'soul-ai', 'reality-intelligence', 'soul-command-center']);

// ── Commands ───────────────────────────────────────────────────────────────

bot.onText(/^\/start/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const settings = db.getSettings(chatId);
    const expr = exprLabel(settings.preferred_expression);
    await sendSafe(chatId,
        `⊕ TRUTHOS is online.\n\nCurrent expression: ${expr}\n\n` +
        `Commands:\n` +
        `/mode — show current expression\n` +
        `/expression [name] — switch expression\n` +
        `/list — list all expressions\n` +
        `/tasks — view open tasks\n` +
        `/done [id] — mark task complete\n` +
        `/wealth — run a wealth scan\n` +
        `/brief — toggle morning brief (current: ${settings.morning_brief ? 'ON' : 'OFF'})\n` +
        `/clear — clear conversation history\n\n` +
        `Send any message to activate TRUTHOS.`
    );
});

bot.onText(/^\/list/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const lines = Object.entries(EXPRESSION_META).map(([key, m]) => `${m.icon} ${key} — ${m.name}`);
    await sendSafe(chatId, `Expressions:\n\n${lines.join('\n')}\n\nUse /expression [name] to switch.`);
});

bot.onText(/^\/mode/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const settings = db.getSettings(chatId);
    await sendSafe(chatId, `Active expression: ${exprLabel(settings.preferred_expression)}`);
});

bot.onText(/^\/expression(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const name = (match[1] || '').trim().toLowerCase();
    if (!name) {
        return sendSafe(chatId, 'Usage: /expression [name]\nUse /list to see all expressions.');
    }

    if (!VALID_EXPRESSIONS.has(name)) {
        return sendSafe(chatId, `Unknown expression: "${name}"\nUse /list to see valid options.`);
    }

    db.setExpression(chatId, name);
    db.clearHistory(chatId);
    await sendSafe(chatId, `Switched to ${exprLabel(name)}. Conversation history cleared.`);
});

bot.onText(/^\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const tasks = db.getOpenTasks(chatId);
    if (tasks.length === 0) {
        return sendSafe(chatId, 'No open tasks. TRUTHOS is ready.');
    }
    const lines = tasks.map(t => `[${t.id}] ${t.content}`).join('\n');
    await sendSafe(chatId, `Open tasks:\n\n${lines}\n\nUse /done [id] to complete a task.`);
});

bot.onText(/^\/done(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const id = match[1];
    if (!id) return sendSafe(chatId, 'Usage: /done [task id]');

    const ok = db.completeTask(chatId, id);
    await sendSafe(chatId, ok ? `Task ${id} complete. ✓` : `Task ${id} not found.`);
});

bot.onText(/^\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    db.clearHistory(chatId);
    await sendSafe(chatId, 'Conversation history cleared.');
});

bot.onText(/^\/brief(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    const settings = db.getSettings(chatId);
    const current = settings.morning_brief;
    const timeArg = (match[1] || '').trim() || settings.morning_time;

    // Validate HH:MM format
    if (!/^\d{2}:\d{2}$/.test(timeArg)) {
        return sendSafe(chatId,
            `Usage: /brief [HH:MM]\nCurrent: ${current ? `ON at ${settings.morning_time}` : 'OFF'}`
        );
    }

    if (current && settings.morning_time === timeArg) {
        db.setMorningBrief(chatId, false, timeArg);
        await sendSafe(chatId, `Morning brief OFF.`);
    } else {
        db.setMorningBrief(chatId, true, timeArg);
        await sendSafe(chatId, `Morning brief ON — daily at ${timeArg} UTC.`);
    }
});

bot.onText(/^\/wealth/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;

    await sendSafe(chatId, '◬ Scanning the field for wealth signals...');
    try {
        const result = await callExpression('', 'wealth-weaver', [], { wealthMode: 'scan' });
        let opportunity;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            opportunity = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.text };
        } catch {
            opportunity = { raw: result.text };
        }

        const scanId = db.saveWealthScan(chatId, opportunity);

        const display = opportunity.raw
            ? opportunity.raw
            : Object.entries(opportunity).map(([k, v]) => `${k}: ${v}`).join('\n');

        await bot.sendMessage(chatId, `◬ WEALTH SIGNAL DETECTED\n\n${display}`, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '✓ YES — Pursue', callback_data: `wealth_yes_${scanId}` },
                    { text: '✗ NO — Pass',   callback_data: `wealth_no_${scanId}`  }
                ]]
            }
        });
    } catch (err) {
        await sendSafe(chatId, `Wealth scan error: ${err.message}`);
    }
});

// ── Inline keyboard callbacks ──────────────────────────────────────────────

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (!isAllowed(chatId)) return bot.answerCallbackQuery(query.id);

    const data = query.data || '';

    if (data.startsWith('wealth_yes_') || data.startsWith('wealth_no_')) {
        const decision = data.startsWith('wealth_yes_') ? 'yes' : 'no';
        const scanId   = data.replace(/^wealth_(yes|no)_/, '');
        const scan     = db.getScanById(chatId, scanId);

        if (!scan) {
            await bot.answerCallbackQuery(query.id, { text: 'Scan not found.' });
            return;
        }

        db.updateWealthDecision(chatId, scanId, decision);

        if (decision === 'no') {
            await bot.answerCallbackQuery(query.id, { text: 'Passed.' });
            await bot.editMessageText(
                query.message.text + '\n\n✗ PASSED',
                { chat_id: chatId, message_id: query.message.message_id }
            );
            return;
        }

        // YES — generate execution plan
        await bot.answerCallbackQuery(query.id, { text: 'Generating execution plan...' });
        await bot.editMessageText(
            query.message.text + '\n\n✓ APPROVED — generating execution plan...',
            { chat_id: chatId, message_id: query.message.message_id }
        );

        try {
            let opportunity;
            try { opportunity = JSON.parse(scan.opportunity); } catch { opportunity = { raw: scan.opportunity }; }

            const result = await callExpression('', 'wealth-weaver', [], {
                wealthMode: 'execute',
                opportunity
            });
            await sendSafe(chatId, `◬ EXECUTION PLAN\n\n${result.text}`);
        } catch (err) {
            await sendSafe(chatId, `Execution plan error: ${err.message}`);
        }
    }
});

// ── Main message handler ───────────────────────────────────────────────────

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    if (!msg.text || msg.text.startsWith('/')) return;

    const input = msg.text.trim();
    const settings = db.getSettings(chatId);
    const expression = settings.preferred_expression;

    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');

    try {
        const history = db.getHistory(chatId, 20);
        db.saveMessage(chatId, 'user', input, expression);

        const result = await callExpression(input, expression, history);

        db.saveMessage(chatId, 'assistant', result.text, expression);

        await sendSafe(chatId, result.text);

        // Auto-extract tasks from task-oriented expressions
        if (TASK_EXTRACTING_EXPRESSIONS.has(expression)) {
            const tasks = extractTasks(result.text);
            for (const task of tasks) {
                db.addTask(chatId, task, expression);
            }
            if (tasks.length > 0) {
                await sendSafe(chatId, `✓ ${tasks.length} task${tasks.length > 1 ? 's' : ''} saved. Use /tasks to view.`);
            }
        }
    } catch (err) {
        console.error('[Telegram] handler error:', err.message);
        await sendSafe(chatId, `Error: ${err.message}`);
    }
});

bot.on('polling_error', (err) => {
    console.error('[Telegram] polling error:', err.message);
});

console.log('[Telegram] Bot polling started.');

module.exports = { bot };
