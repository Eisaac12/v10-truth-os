// Morning brief scheduler — cron fires every minute, checks per-user morning_time
const cron = require('node-cron');
const db = require('./db');
const { callExpression } = require('./expressions');

let _bot = null;

async function sendBrief(chatId, settings) {
    try {
        const tasks = db.getOpenTasks(chatId);
        const taskContext = tasks.length > 0
            ? `\n\nOpen tasks:\n${tasks.map((t, i) => `${i + 1}. ${t.content}`).join('\n')}`
            : '\n\nNo open tasks — clean slate today.';

        const prompt =
            `Generate a morning brief for the day.${taskContext}\n\n` +
            `Include:\n` +
            `1. ONE grounding energy check (how to enter the day with maximum frequency)\n` +
            `2. The single most important action for today\n` +
            `3. A truth statement to carry through the day\n\n` +
            `Keep it tight — 3 short sections max. Telegram format (no markdown headers).`;

        const result = await callExpression(prompt, 'the-general', []);

        const expression = settings.preferred_expression || 'the-general';
        const intro = `⚔ MORNING BRIEF — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
        await _bot.sendMessage(chatId, `${intro}\n\n${result.text}`);
    } catch (err) {
        console.error(`[Scheduler] brief error for ${chatId}:`, err.message);
    }
}

function init(botInstance) {
    _bot = botInstance;

    // Run every minute — check if any subscriber's morning_time matches HH:MM now
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const hh = String(now.getUTCHours()).padStart(2, '0');
        const mm = String(now.getUTCMinutes()).padStart(2, '0');
        const currentTime = `${hh}:${mm}`;

        const subscribers = db.getAllBriefSubscribers();
        for (const settings of subscribers) {
            if (settings.morning_time === currentTime) {
                await sendBrief(settings.chat_id, settings);
            }
        }
    });

    console.log('[Scheduler] Morning brief cron active.');
}

module.exports = { init };
