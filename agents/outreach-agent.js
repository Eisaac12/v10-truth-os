// agents/outreach-agent.js — DM Cold Outreach Agent
// Finds prospects on Twitter who are dealing with illusions Truth Weaver can dissolve.
// Sends personalized, truth-based DMs. No spam — surgical, value-first targeting.
// Required env: TWITTER_API_KEY, TWITTER_API_SECRET,
//               TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, ANTHROPIC_API_KEY
// Optional env: OUTREACH_DAILY_LIMIT (default 15)

require('dotenv').config();
const TruthCore = require('./truth-core');
const memory = require('./memory');

const DAILY_LIMIT = parseInt(process.env.OUTREACH_DAILY_LIMIT || '15', 10);
const APP_URL = process.env.TWITTER_APP_URL || 'https://your-app.vercel.app';

// Search queries that surface people in pain points Truth Weaver addresses
const PROSPECT_QUERIES = [
    '"I don\'t know where to start" -is:retweet lang:en',
    '"stuck in my head" -is:retweet lang:en',
    '"overthinking everything" -is:retweet lang:en',
    '"why can\'t I" productivity -is:retweet lang:en',
    '"I keep procrastinating" -is:retweet lang:en',
    '"living in fear" -is:retweet lang:en',
    '"I know what I need to do but" -is:retweet lang:en',
    '"I feel stuck" career -is:retweet lang:en',
    '"my own worst enemy" -is:retweet lang:en',
    '"scared to start" business -is:retweet lang:en'
];

function getTwitterClient() {
    const { TwitterApi } = require('twitter-api-v2');
    if (!process.env.TWITTER_API_KEY) throw new Error('TWITTER_API_KEY not set');
    return new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET
    });
}

function getAlreadyContactedIds() {
    return new Set((memory.get('outreachLog') || []).map(o => o.targetId));
}

function todayOutreachCount() {
    const today = new Date().toISOString().slice(0, 10);
    return (memory.get('outreachLog') || []).filter(o => o.date === today).length;
}

class OutreachAgent {
    constructor() {
        this.name = 'outreach-agent';
        this.core = new TruthCore();
    }

    async findProspects(limit = 20) {
        const client = getTwitterClient();
        const query = PROSPECT_QUERIES[Math.floor(Math.random() * PROSPECT_QUERIES.length)];
        console.log(`[outreach-agent] Searching: ${query}`);

        const results = await client.v2.search(query, {
            max_results: Math.min(limit, 100),
            'tweet.fields': ['author_id', 'text', 'public_metrics', 'created_at'],
            'user.fields': ['name', 'username', 'description', 'public_metrics'],
            expansions: ['author_id'],
            sort_order: 'recency'
        });

        const tweets = results.data?.data || [];
        const users = results.includes?.users || [];
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));

        // Filter: >50 followers, not already contacted, tweet <48h old
        const contacted = getAlreadyContactedIds();
        const cutoff = Date.now() - 48 * 3600 * 1000;

        return tweets
            .filter(t => {
                if (contacted.has(t.author_id)) return false;
                const user = userMap[t.author_id];
                if (!user) return false;
                if ((user.public_metrics?.followers_count || 0) < 50) return false;
                if (new Date(t.created_at).getTime() < cutoff) return false;
                return true;
            })
            .map(t => ({ tweet: t, user: userMap[t.author_id] }));
    }

    async generateDM(prospect) {
        const { tweet, user } = prospect;
        const context = `Target: @${user.username} (${user.public_metrics?.followers_count} followers)\nBio: ${user.description || 'none'}\nTweet: "${tweet.text}"`;

        const dm = await this.core.generate(
            'Generate a personalized cold outreach DM for Twitter',
            `${context}

The DM must:
- Reference their EXACT tweet or bio (show you read it)
- Apply a Truth Weaver insight to their specific situation — be surgical, not generic
- Be 2-4 sentences max
- End with a soft CTA: offer the free tool at ${APP_URL} as a resource, not a pitch
- Sound completely human — not AI-generated
- No "Hey!" openers. No "I noticed..." Start mid-thought.
- No emojis unless they used them

Output ONLY the DM text. Nothing else.`,
            { maxTokens: 200 }
        );

        return dm.trim();
    }

    async sendDM(userId, text) {
        const client = getTwitterClient();
        // Twitter API v2 DM endpoint
        await client.v2.sendDmToParticipant(userId, { text });
    }

    async run() {
        console.log('[outreach-agent] Running...');

        const todayCount = todayOutreachCount();
        if (todayCount >= DAILY_LIMIT) {
            console.log(`[outreach-agent] Daily limit (${DAILY_LIMIT}) reached. Stopping.`);
            return { success: true, skipped: true, reason: 'daily limit reached' };
        }

        let prospects;
        try {
            prospects = await this.findProspects(50);
        } catch (err) {
            console.error('[outreach-agent] Search error:', err.message);
            return { success: false, error: err.message };
        }

        console.log(`[outreach-agent] Found ${prospects.length} prospects. Contacting up to ${DAILY_LIMIT - todayCount}.`);

        const results = [];
        const remaining = DAILY_LIMIT - todayCount;

        for (const prospect of prospects.slice(0, remaining)) {
            try {
                const dm = await this.generateDM(prospect);
                await this.sendDM(prospect.tweet.author_id, dm);

                const logEntry = {
                    targetId: prospect.tweet.author_id,
                    username: prospect.user.username,
                    tweetText: prospect.tweet.text.substring(0, 100),
                    dmPreview: dm.substring(0, 100),
                    date: new Date().toISOString().slice(0, 10),
                    sentAt: new Date().toISOString(),
                    replied: false
                };
                memory.push('outreachLog', logEntry);
                memory.incrementMetric('totalOutreach');
                results.push({ username: prospect.user.username, success: true });

                console.log(`[outreach-agent] Sent DM to @${prospect.user.username}`);

                // Rate limit buffer between DMs
                await new Promise(r => setTimeout(r, 3000));
            } catch (err) {
                console.error(`[outreach-agent] DM to @${prospect.user?.username} failed:`, err.message);
                results.push({ username: prospect.user?.username, success: false, error: err.message });
            }
        }

        memory.markRun(this.name);
        return { success: true, sent: results.filter(r => r.success).length, results };
    }
}

module.exports = OutreachAgent;

if (require.main === module) {
    const agent = new OutreachAgent();
    agent.run().then(r => console.log('[outreach-agent] Result:', JSON.stringify(r, null, 2)));
}
