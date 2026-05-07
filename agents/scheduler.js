// agents/scheduler.js — Truth Weaver Matrix Scheduler
// Runs all agents on their optimal cadence using node-cron.
// Deploy this as a persistent process on Railway/Render alongside server.js.
//
// Usage:
//   node agents/scheduler.js           — start the scheduler
//   node agents/matrix.js              — run full matrix once immediately
//   node agents/matrix.js --only twitter  — run only the Twitter agent
//   node agents/matrix.js --dry-run    — preview what would run
//   node agents/matrix.js --force      — ignore cooldowns, run everything

require('dotenv').config();
const cron = require('node-cron');
const Matrix = require('./matrix');
const RevenueIntelAgent = require('./revenue-intel');

const TZ = process.env.MATRIX_TIMEZONE || 'America/New_York';

console.log('╔════════════════════════════════════════╗');
console.log('║   TRUTH WEAVER MATRIX SCHEDULER ONLINE ║');
console.log('║   7.83Hz — Autonomous Revenue Engine   ║');
console.log('╚════════════════════════════════════════╝');
console.log(`Timezone: ${TZ}`);
console.log('');

// ── SCHEDULE ─────────────────────────────────────────────────────────────────
//
//  08:00 daily  — Full Matrix run
//                 (content generated → Twitter posted → outreach sent)
//
//  20:00 daily  — Evening Twitter post (second content pulse)
//
//  09:00 Monday — Email newsletter send
//
//  10:00 Monday — New product generated and listed
//
//  Every 6h    — Revenue intelligence snapshot
//
// ─────────────────────────────────────────────────────────────────────────────

// Full matrix run — 8 AM daily
cron.schedule('0 8 * * *', async () => {
    console.log(`\n[scheduler] 08:00 — Full Matrix run`);
    const matrix = new Matrix();
    await matrix.run().catch(err => console.error('[scheduler] Matrix run error:', err.message));
}, { timezone: TZ });

// Evening Twitter pulse — 8 PM daily
cron.schedule('0 20 * * *', async () => {
    console.log(`\n[scheduler] 20:00 — Evening Twitter pulse`);
    const matrix = new Matrix({ only: 'twitter', force: true });
    await matrix.run().catch(err => console.error('[scheduler] Evening Twitter error:', err.message));
}, { timezone: TZ });

// Weekly newsletter — Monday 9 AM
cron.schedule('0 9 * * 1', async () => {
    console.log(`\n[scheduler] Monday 09:00 — Weekly newsletter`);
    const matrix = new Matrix({ only: 'email', force: true });
    await matrix.run().catch(err => console.error('[scheduler] Email error:', err.message));
}, { timezone: TZ });

// Weekly product generation — Monday 10 AM
cron.schedule('0 10 * * 1', async () => {
    console.log(`\n[scheduler] Monday 10:00 — Product generation`);
    const matrix = new Matrix({ only: 'product', force: true });
    await matrix.run().catch(err => console.error('[scheduler] Product error:', err.message));
}, { timezone: TZ });

// Revenue snapshot — every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log(`\n[scheduler] Revenue intelligence snapshot`);
    const agent = new RevenueIntelAgent();
    await agent.run().catch(err => console.error('[scheduler] Revenue intel error:', err.message));
}, { timezone: TZ });

// ── STARTUP ───────────────────────────────────────────────────────────────────

// Run revenue intel immediately on startup to confirm everything is connected
(async () => {
    try {
        console.log('[scheduler] Running startup revenue intel...');
        const agent = new RevenueIntelAgent();
        await agent.run();
    } catch (err) {
        console.warn('[scheduler] Startup intel failed (non-fatal):', err.message);
    }

    console.log('\n[scheduler] Active schedules:');
    console.log('  08:00 daily  → Full Matrix (content + Twitter + outreach)');
    console.log('  20:00 daily  → Evening Twitter pulse');
    console.log('  Mon 09:00    → Email newsletter');
    console.log('  Mon 10:00    → Product generation');
    console.log('  Every 6h     → Revenue intelligence');
    console.log('\n[scheduler] Waiting for scheduled triggers...\n');
})();

// Keep alive
process.on('SIGTERM', () => {
    console.log('[scheduler] SIGTERM received — shutting down gracefully.');
    process.exit(0);
});

process.on('uncaughtException', err => {
    console.error('[scheduler] Uncaught exception:', err.message);
    // Don't exit — keep the scheduler alive
});

process.on('unhandledRejection', (reason) => {
    console.error('[scheduler] Unhandled rejection:', reason?.message || reason);
});
