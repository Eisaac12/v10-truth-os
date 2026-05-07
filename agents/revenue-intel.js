// agents/revenue-intel.js — Revenue Intelligence Agent
// Monitors Stripe revenue, tracks agent performance, generates daily briefings.
// Required env: STRIPE_SECRET_KEY
// Optional env: ANTHROPIC_API_KEY (for AI-generated insights)

require('dotenv').config();
const memory = require('./memory');

async function getStripeSnapshot() {
    if (!process.env.STRIPE_SECRET_KEY) {
        return { available: false, reason: 'STRIPE_SECRET_KEY not set' };
    }

    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400;
    const weekAgo = now - 7 * 86400;
    const monthAgo = now - 30 * 86400;

    const [todayCharges, weekCharges, monthCharges, activeSubs] = await Promise.all([
        stripe.charges.list({ created: { gte: dayAgo }, limit: 100 }),
        stripe.charges.list({ created: { gte: weekAgo }, limit: 100 }),
        stripe.charges.list({ created: { gte: monthAgo }, limit: 100 }),
        stripe.subscriptions.list({ status: 'active', limit: 100 })
    ]);

    const sum = charges => charges.data
        .filter(c => !c.refunded && c.status === 'succeeded')
        .reduce((t, c) => t + c.amount, 0) / 100;

    const todayMRR = activeSubs.data.reduce((t, s) => {
        const price = s.items.data[0]?.price;
        if (!price) return t;
        const monthly = price.recurring?.interval === 'year'
            ? (price.unit_amount / 12)
            : price.unit_amount;
        return t + monthly;
    }, 0) / 100;

    return {
        available: true,
        today: sum(todayCharges),
        week: sum(weekCharges),
        month: sum(monthCharges),
        mrr: todayMRR,
        activeSubscriptions: activeSubs.data.length,
        arr: todayMRR * 12,
        snapshotAt: new Date().toISOString()
    };
}

function buildReport(stripe, agentSummary) {
    const lines = [
        '╔══════════════════════════════════════╗',
        '║     TRUTH WEAVER REVENUE INTEL       ║',
        '╚══════════════════════════════════════╝',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '── REVENUE ─────────────────────────────'
    ];

    if (stripe.available) {
        lines.push(`Today:          $${stripe.today.toFixed(2)}`);
        lines.push(`This week:      $${stripe.week.toFixed(2)}`);
        lines.push(`This month:     $${stripe.month.toFixed(2)}`);
        lines.push(`MRR:            $${stripe.mrr.toFixed(2)}`);
        lines.push(`ARR (run rate): $${stripe.arr.toFixed(2)}`);
        lines.push(`Active subs:    ${stripe.activeSubscriptions}`);
    } else {
        lines.push(`Stripe: ${stripe.reason}`);
    }

    lines.push('');
    lines.push('── AGENT ACTIVITY ───────────────────────');
    lines.push(`Tweets posted:  ${agentSummary.metrics?.totalTweets || 0}`);
    lines.push(`Emails sent:    ${agentSummary.metrics?.totalEmailsSent || 0}`);
    lines.push(`DMs sent:       ${agentSummary.metrics?.totalOutreach || 0}`);
    lines.push(`Subscribers:    ${agentSummary.subscribers}`);
    lines.push(`Content queue:  ${agentSummary.queuedContent} items`);

    lines.push('');
    lines.push('── LAST AGENT RUNS ──────────────────────');
    const runs = agentSummary.lastRun || {};
    for (const [agent, ts] of Object.entries(runs)) {
        const ago = ts ? Math.round((Date.now() - new Date(ts)) / 60000) + 'm ago' : 'never';
        lines.push(`${agent.padEnd(20)} ${ago}`);
    }

    lines.push('');
    lines.push('══════════════════════════════════════════');

    return lines.join('\n');
}

class RevenueIntelAgent {
    constructor() {
        this.name = 'revenue-intel';
    }

    async run() {
        console.log('[revenue-intel] Running...');

        try {
            const [stripe, agentSummary] = await Promise.all([
                getStripeSnapshot(),
                Promise.resolve(memory.summary())
            ]);

            const report = buildReport(stripe, agentSummary);
            console.log('\n' + report + '\n');

            const snapshot = {
                date: new Date().toISOString().slice(0, 10),
                ...stripe,
                agentMetrics: agentSummary.metrics,
                reportedAt: new Date().toISOString()
            };

            memory.push('revenueLog', snapshot);

            if (stripe.available) {
                memory.updateMetric('totalRevenue', stripe.month);
                memory.updateMetric('lastRevenueCheck', new Date().toISOString());
                memory.updateMetric('activeSubs', stripe.activeSubscriptions);
                memory.updateMetric('mrr', stripe.mrr);
            }

            memory.markRun(this.name);
            return { success: true, snapshot, report };
        } catch (err) {
            console.error('[revenue-intel] Error:', err.message);
            return { success: false, error: err.message };
        }
    }

    // Returns latest revenue snapshot from memory (no API call)
    getLatest() {
        const log = memory.get('revenueLog') || [];
        return log[log.length - 1] || null;
    }
}

module.exports = RevenueIntelAgent;

if (require.main === module) {
    const agent = new RevenueIntelAgent();
    agent.run().then(r => {
        if (!r.success) console.error('[revenue-intel] Failed:', r.error);
    });
}
