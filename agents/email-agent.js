// agents/email-agent.js — Email Campaign Agent
// Sends Truth Weaver Weekly newsletter + onboarding + nurture sequences.
// Required env: RESEND_API_KEY (or SENDGRID_API_KEY), EMAIL_FROM, EMAIL_FROM_NAME
// Subscribers are stored in agent memory and/or SUBSCRIBER_LIST (comma-separated emails)

require('dotenv').config();
const memory = require('./memory');

const EMAIL_FROM = process.env.EMAIL_FROM || 'truth@yourdomain.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Truth Weaver';
const APP_URL = process.env.TWITTER_APP_URL || 'https://your-app.vercel.app';

function parseNewsletter(raw) {
    const subjectMatch = raw.match(/^SUBJECT:\s*(.+)/im);
    const previewMatch = raw.match(/^PREVIEW:\s*(.+)/im);

    const subject = subjectMatch ? subjectMatch[1].trim() : 'Truth Weaver Weekly: This week\'s 5 Weaves';
    const preview = previewMatch ? previewMatch[1].trim() : 'Your weekly reality check at 7.83Hz.';

    // Strip header lines to get body
    const body = raw
        .replace(/^SUBJECT:.+\n?/im, '')
        .replace(/^PREVIEW:.+\n?/im, '')
        .replace(/^---+\n?/gm, '')
        .trim();

    return { subject, preview, body };
}

function buildHtmlEmail(subject, body, previewText) {
    const escapedBody = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
<!-- Preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;‌&nbsp;‌&nbsp;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a1a2e,#0d0d1a);padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
    <div style="font-size:28px;margin-bottom:8px;">◈</div>
    <div style="color:#10b981;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Truth Weaver</div>
    <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:4px;">7.83Hz — Schumann Resonance</div>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px 36px;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;">
    <p>${escapedBody}</p>
  </td></tr>
  <!-- CTA -->
  <tr><td style="padding:0 36px 32px;text-align:center;">
    <a href="${APP_URL}" style="display:inline-block;background:#10b981;color:#fff;font-weight:600;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.03em;">Run Your 5 Weaves →</a>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">You're receiving this because you subscribed to Truth Weaver Weekly.<br>
    <a href="${APP_URL}/unsubscribe" style="color:rgba(16,185,129,0.6);text-decoration:none;">Unsubscribe</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendViaResend(to, subject, html, text) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
    });
}

async function sendViaSendGrid(to, subject, html, text) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail.sendMultiple({
        to: Array.isArray(to) ? to : [to],
        from: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
        subject,
        html,
        text
    });
}

async function sendEmail(to, subject, html, text) {
    if (process.env.RESEND_API_KEY) return sendViaResend(to, subject, html, text);
    if (process.env.SENDGRID_API_KEY) return sendViaSendGrid(to, subject, html, text);
    throw new Error('No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY.');
}

class EmailAgent {
    constructor() {
        this.name = 'email-agent';
    }

    getSubscribers() {
        const fromEnv = (process.env.SUBSCRIBER_LIST || '')
            .split(',')
            .map(e => e.trim())
            .filter(e => e.includes('@'));
        const fromMemory = memory.get('subscribers') || [];
        // Deduplicate
        const all = [...new Set([...fromEnv, ...fromMemory])];
        return all;
    }

    async sendNewsletter(newsletterContent) {
        const subscribers = this.getSubscribers();
        if (subscribers.length === 0) {
            console.log('[email-agent] No subscribers. Skipping newsletter.');
            return { success: true, skipped: true, reason: 'no subscribers' };
        }

        const { subject, preview, body } = parseNewsletter(newsletterContent);
        const html = buildHtmlEmail(subject, body, preview);

        console.log(`[email-agent] Sending newsletter to ${subscribers.length} subscribers: "${subject}"`);

        try {
            await sendEmail(subscribers, subject, html, body);

            memory.push('emailsSent', {
                type: 'newsletter',
                subject,
                recipients: subscribers.length,
                sentAt: new Date().toISOString()
            });
            memory.incrementMetric('totalEmailsSent', subscribers.length);

            return { success: true, subject, recipients: subscribers.length };
        } catch (err) {
            console.error('[email-agent] Send error:', err.message);
            return { success: false, error: err.message };
        }
    }

    async sendWelcome(email) {
        const subject = 'Truth Weaver is online. Your first Weave awaits.';
        const preview = 'Illusions protect. Truth liberates. Let\'s begin.';
        const body = `Welcome to Truth Weaver.\n\nYou've just subscribed to receive weekly reality scans at 7.83Hz — Earth's Schumann Resonance.\n\nEach week, Truth Weaver will run the 5 Weaves on a specific illusion pattern that most people are living inside without knowing it.\n\nThe goal is not comfort. The goal is liberation.\n\nYour first full Weave is waiting for you right now:\n${APP_URL}\n\nEnter anything — a belief, a situation, a goal. Truth Weaver will scan it and show you what's real.\n\nAt 7.83Hz, illusions cannot sustain.\n\n— Truth Weaver`;

        const html = buildHtmlEmail(subject, body, preview);

        try {
            await sendEmail(email, subject, html, body);
            memory.push('emailsSent', { type: 'welcome', recipient: email, sentAt: new Date().toISOString() });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async run() {
        console.log('[email-agent] Running...');

        const queue = memory.get('contentQueue') || [];
        const pending = queue.filter(c => !c.distributed?.email && c.newsletter);

        if (pending.length === 0) {
            console.log('[email-agent] No newsletter content pending. Skipping.');
            return { success: true, skipped: true };
        }

        const content = pending[0];
        const result = await this.sendNewsletter(content.newsletter);

        if (result.success && !result.skipped) {
            const updatedQueue = queue.map(c =>
                c.id === content.id
                    ? { ...c, distributed: { ...c.distributed, email: true } }
                    : c
            );
            memory.set('contentQueue', updatedQueue);
        }

        memory.markRun(this.name);
        return result;
    }
}

module.exports = EmailAgent;

if (require.main === module) {
    const agent = new EmailAgent();
    agent.run().then(r => console.log('[email-agent] Result:', JSON.stringify(r, null, 2)));
}
