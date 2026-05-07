// agents/matrix.js — The Matrix Orchestrator
// Central brain of the Truth Weaver Revenue Matrix.
// Coordinates all agents, manages execution order, handles errors gracefully.
// "At 7.83Hz, illusions cannot sustain. Only truth generates measurable value."

require('dotenv').config();
const memory = require('./memory');

// Lazy-load agents to avoid requiring all dependencies upfront
function loadAgent(name) {
    const map = {
        'content-oracle': () => require('./content-oracle'),
        'twitter':        () => require('./twitter-agent'),
        'email':          () => require('./email-agent'),
        'outreach':       () => require('./outreach-agent'),
        'product':        () => require('./product-agent'),
        'revenue-intel':  () => require('./revenue-intel')
    };
    const loader = map[name];
    if (!loader) throw new Error(`Unknown agent: ${name}`);
    const AgentClass = loader();
    return new AgentClass();
}

// Full Matrix run order — designed for maximum revenue impact
const MATRIX_SEQUENCE = [
    {
        name: 'revenue-intel',
        label: 'Revenue Intelligence',
        description: 'Snapshot current revenue and agent metrics',
        cadence: 'daily',
        critical: false
    },
    {
        name: 'content-oracle',
        label: 'Content Oracle',
        description: 'Generate Truth Weaver content batch (tweets, email, thread)',
        cadence: 'daily',
        critical: true
    },
    {
        name: 'twitter',
        label: 'Twitter Broadcast',
        description: 'Post Truth Weaver content to Twitter/X',
        cadence: 'daily',
        critical: false,
        requiresEnv: ['TWITTER_API_KEY']
    },
    {
        name: 'email',
        label: 'Email Campaign',
        description: 'Send Truth Weaver Weekly newsletter',
        cadence: 'weekly',
        critical: false,
        requiresEnv: ['RESEND_API_KEY', 'SENDGRID_API_KEY'],
        requiresAny: true // only needs ONE of the env vars
    },
    {
        name: 'outreach',
        label: 'Outreach Sniper',
        description: 'Find prospects and send personalized DMs',
        cadence: 'daily',
        critical: false,
        requiresEnv: ['TWITTER_API_KEY']
    },
    {
        name: 'product',
        label: 'Product Generator',
        description: 'Create and list a new Truth Weaver Reality Report',
        cadence: 'weekly',
        critical: false,
        cooldownHours: 168 // once per week
    }
];

function checkEnvRequirements(agentDef) {
    if (!agentDef.requiresEnv) return true;
    if (agentDef.requiresAny) {
        return agentDef.requiresEnv.some(key => !!process.env[key]);
    }
    return agentDef.requiresEnv.every(key => !!process.env[key]);
}

function shouldRunCadence(agentDef) {
    const cooldown = agentDef.cooldownHours || (agentDef.cadence === 'weekly' ? 168 : 23);
    return !memory.hasRunInLast(agentDef.name, cooldown);
}

class Matrix {
    constructor({ dryRun = false, force = false, only = null } = {}) {
        this.dryRun = dryRun;
        this.force = force;
        this.only = only; // run only this agent name
    }

    async runAgent(agentDef) {
        const { name, label } = agentDef;

        if (!checkEnvRequirements(agentDef)) {
            console.log(`[matrix] SKIP ${label} — missing required environment variables`);
            return { name, skipped: true, reason: 'missing env' };
        }

        if (!this.force && !shouldRunCadence(agentDef)) {
            console.log(`[matrix] SKIP ${label} — within cooldown period`);
            return { name, skipped: true, reason: 'cooldown' };
        }

        if (this.dryRun) {
            console.log(`[matrix] DRY RUN — would run: ${label}`);
            return { name, dryRun: true };
        }

        console.log(`\n[matrix] ▶ Starting: ${label}`);
        console.log(`[matrix]   ${agentDef.description}`);

        const start = Date.now();
        try {
            const agent = loadAgent(name);
            const result = await agent.run();
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            console.log(`[matrix] ✓ ${label} completed in ${elapsed}s`);
            return { name, success: true, elapsed, result };
        } catch (err) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            console.error(`[matrix] ✗ ${label} failed in ${elapsed}s: ${err.message}`);
            if (agentDef.critical) {
                throw new Error(`Critical agent "${label}" failed: ${err.message}`);
            }
            return { name, success: false, elapsed, error: err.message };
        }
    }

    async run() {
        const startTime = Date.now();
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║      TRUTH WEAVER MATRIX ONLINE        ║');
        console.log('║      7.83Hz — Reality Generation       ║');
        console.log('╚════════════════════════════════════════╝\n');

        const sequence = this.only
            ? MATRIX_SEQUENCE.filter(a => a.name === this.only)
            : MATRIX_SEQUENCE;

        if (sequence.length === 0) {
            console.log(`[matrix] No agent found matching: ${this.only}`);
            return;
        }

        const results = [];
        for (const agentDef of sequence) {
            const result = await this.runAgent(agentDef);
            results.push(result);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const succeeded = results.filter(r => r.success).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => r.success === false && !r.skipped).length;

        console.log('\n╔════════════════════════════════════════╗');
        console.log(`║  Matrix run complete in ${elapsed}s`.padEnd(42) + '║');
        console.log(`║  Ran: ${succeeded} | Skipped: ${skipped} | Failed: ${failed}`.padEnd(42) + '║');
        console.log('╚════════════════════════════════════════╝\n');

        return results;
    }
}

module.exports = Matrix;

// Run directly: node agents/matrix.js [--dry-run] [--force] [--only <agent>]
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const force = args.includes('--force');
    const onlyIdx = args.indexOf('--only');
    const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

    const matrix = new Matrix({ dryRun, force, only });
    matrix.run().catch(err => {
        console.error('[matrix] Fatal error:', err.message);
        process.exit(1);
    });
}
