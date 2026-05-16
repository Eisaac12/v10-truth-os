// api/_telegram-alert.js — ALERT Thread: Telegram push notifications
// Fires when a high-signal wealth opportunity is detected.
// Requires: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment.

const ALERT_THRESHOLD_SCORE = 80; // Only alert on high-frequency scans

// Effort-to-urgency map: minimal/low opportunities are higher signal
const EFFORT_URGENCY = { minimal: 95, low: 85, medium: 65, high: 40 };
const HORIZON_URGENCY = { immediate: 95, 'short-term': 80, 'medium-term': 60, 'long-term': 35 };

function scoreOpportunity(opportunity) {
    if (!opportunity) return 0;
    const effortScore   = EFFORT_URGENCY[opportunity.effortLevel]   || 50;
    const horizonScore  = HORIZON_URGENCY[opportunity.timeHorizon]  || 50;
    return Math.round((effortScore + horizonScore) / 2);
}

function formatAlertMessage(opportunity) {
    const score = scoreOpportunity(opportunity);
    return [
        `⚡ *WEALTH WEAVER ALERT* — Score: ${score}/100`,
        ``,
        `*${escapeMarkdown(opportunity.title || 'Opportunity Detected')}*`,
        ``,
        `📡 ${escapeMarkdown(opportunity.valueGradient || '')}`,
        ``,
        `💰 Scale: ${escapeMarkdown(opportunity.scaleMin || '?')} → ${escapeMarkdown(opportunity.scaleMax || '?')}`,
        `⚡ Effort: ${escapeMarkdown(opportunity.effortLevel || '?')} | ⏱ ${escapeMarkdown(opportunity.timeHorizon || '?')}`,
        ``,
        `🎯 *First Move:* ${escapeMarkdown(opportunity.firstMove || '')}`,
        ``,
        `_Open TRUTHOS to approve or reject._`
    ].join('\n');
}

function escapeMarkdown(text) {
    return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, c => `\\${c}`);
}

async function sendTelegramAlert(opportunity) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return { sent: false, reason: 'no credentials' };

    const score = scoreOpportunity(opportunity);
    if (score < ALERT_THRESHOLD_SCORE) return { sent: false, reason: `score ${score} below threshold ${ALERT_THRESHOLD_SCORE}` };

    const text = formatAlertMessage(opportunity);

    try {
        const res = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
                signal:  AbortSignal.timeout(8000)
            }
        );

        if (!res.ok) {
            const err = await res.text().catch(() => res.status);
            console.error(`[Telegram Alert] Send failed: ${err}`);
            return { sent: false, reason: String(err) };
        }

        console.log(`[Telegram Alert] Sent — "${opportunity.title}" (score: ${score})`);
        return { sent: true, score };
    } catch (err) {
        console.error(`[Telegram Alert] Error: ${err.message}`);
        return { sent: false, reason: err.message };
    }
}

module.exports = { sendTelegramAlert, scoreOpportunity };
