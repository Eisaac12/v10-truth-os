// agents/memory.js — Shared persistent state for the Matrix agent system
// Agents read/write here to coordinate, avoid repetition, and track results.
// Backed by a local JSON file; upgrade to Redis/Supabase for multi-instance.

const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '../.agent-memory.json');

const DEFAULT_STATE = {
    lastRun: {},          // agentName → ISO timestamp of last run
    twitterPosts: [],     // posted tweet IDs + content
    emailsSent: [],       // emails sent (recipient, subject, date)
    outreachLog: [],      // DMs sent (target, message, date, replied)
    productsCreated: [],  // products generated (title, url, revenue)
    revenueLog: [],       // daily revenue snapshots
    contentQueue: [],     // generated content waiting to be distributed
    subscribers: [],      // email subscribers collected
    metrics: {
        totalTweets: 0,
        totalEmailsSent: 0,
        totalOutreach: 0,
        totalRevenue: 0,
        lastRevenueCheck: null
    }
};

function load() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
            return { ...DEFAULT_STATE, ...JSON.parse(raw) };
        }
    } catch (e) {
        console.warn('[memory] Could not load state file, starting fresh:', e.message);
    }
    return { ...DEFAULT_STATE };
}

function save(state) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
        console.error('[memory] Could not save state:', e.message);
    }
}

class AgentMemory {
    constructor() {
        this.state = load();
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;
        save(this.state);
    }

    push(key, item) {
        if (!Array.isArray(this.state[key])) this.state[key] = [];
        this.state[key].push(item);
        // Cap arrays at 1000 items to prevent unbounded growth
        if (this.state[key].length > 1000) this.state[key] = this.state[key].slice(-1000);
        save(this.state);
    }

    updateMetric(key, value) {
        if (!this.state.metrics) this.state.metrics = {};
        this.state.metrics[key] = value;
        save(this.state);
    }

    incrementMetric(key, by = 1) {
        if (!this.state.metrics) this.state.metrics = {};
        this.state.metrics[key] = (this.state.metrics[key] || 0) + by;
        save(this.state);
    }

    markRun(agentName) {
        if (!this.state.lastRun) this.state.lastRun = {};
        this.state.lastRun[agentName] = new Date().toISOString();
        save(this.state);
    }

    getLastRun(agentName) {
        return this.state.lastRun?.[agentName] || null;
    }

    hasRunInLast(agentName, hours) {
        const last = this.getLastRun(agentName);
        if (!last) return false;
        return (Date.now() - new Date(last).getTime()) < hours * 3600 * 1000;
    }

    summary() {
        return {
            metrics: this.state.metrics,
            queuedContent: (this.state.contentQueue || []).length,
            subscribers: (this.state.subscribers || []).length,
            lastRun: this.state.lastRun
        };
    }
}

module.exports = new AgentMemory();
