// agents/twitter-agent.js — Twitter/X Broadcast Agent
// Posts Truth Weaver content, engages with replies, builds audience.
// Required env: TWITTER_API_KEY, TWITTER_API_SECRET,
//               TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
// Optional env: TWITTER_APP_URL (your deployed app link)

require('dotenv').config();
const memory = require('./memory');

const APP_URL = process.env.TWITTER_APP_URL || 'https://your-app.vercel.app';

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

class TwitterAgent {
    constructor() {
        this.name = 'twitter-agent';
    }

    injectUrl(text) {
        return text.replace('[link]', APP_URL).replace('[your link]', APP_URL);
    }

    async postTweet(text) {
        const client = getTwitterClient();
        const tweet = await client.v2.tweet(this.injectUrl(text));
        return tweet.data;
    }

    async postThread(tweets) {
        const client = getTwitterClient();
        let previousId = null;
        const posted = [];

        for (const text of tweets) {
            const payload = { text: this.injectUrl(text) };
            if (previousId) payload.reply = { in_reply_to_tweet_id: previousId };

            const result = await client.v2.tweet(payload);
            previousId = result.data.id;
            posted.push(result.data);

            // Brief pause between thread tweets to avoid rate limits
            if (tweets.indexOf(text) < tweets.length - 1) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        return posted;
    }

    // Search for relevant conversations to engage with
    async findEngagementTargets() {
        const client = getTwitterClient();
        const queries = [
            'self-improvement -is:retweet lang:en',
            'consciousness AI -is:retweet lang:en',
            'truth mindset -is:retweet lang:en',
            'illusion reality -is:retweet lang:en',
            'frequency abundance -is:retweet lang:en'
        ];

        const query = queries[Math.floor(Math.random() * queries.length)];
        const results = await client.v2.search(query, {
            max_results: 10,
            'tweet.fields': ['author_id', 'text', 'public_metrics'],
            sort_order: 'relevancy'
        });

        return results.data?.data || [];
    }

    async run() {
        console.log('[twitter-agent] Running...');

        const queue = memory.get('contentQueue') || [];
        const pending = queue.filter(c => !c.distributed?.twitter);

        if (pending.length === 0) {
            console.log('[twitter-agent] No pending content. Skipping.');
            return { success: true, skipped: true };
        }

        const content = pending[0];

        try {
            let posted;
            if (content.tweetThread && content.tweetThread.length > 1) {
                posted = await this.postThread(content.tweetThread);
                console.log(`[twitter-agent] Posted thread (${posted.length} tweets). First ID: ${posted[0]?.id}`);
            } else {
                const text = content.singleTweet || content.tweetThread?.[0] || '';
                posted = [await this.postTweet(text)];
                console.log(`[twitter-agent] Posted single tweet. ID: ${posted[0]?.id}`);
            }

            // Mark as distributed
            const updatedQueue = queue.map(c =>
                c.id === content.id
                    ? { ...c, distributed: { ...c.distributed, twitter: true }, twitterPostId: posted[0]?.id }
                    : c
            );
            memory.set('contentQueue', updatedQueue);

            memory.push('twitterPosts', {
                tweetId: posted[0]?.id,
                theme: content.theme,
                postedAt: new Date().toISOString(),
                threadLength: posted.length
            });
            memory.incrementMetric('totalTweets', posted.length);
            memory.markRun(this.name);

            return { success: true, posted };
        } catch (err) {
            console.error('[twitter-agent] Error:', err.message);
            return { success: false, error: err.message };
        }
    }

    // Post a single raw tweet (for the scheduler's daily single-tweet cadence)
    async postDailyInsight(text) {
        try {
            const result = await this.postTweet(text);
            memory.push('twitterPosts', {
                tweetId: result.id,
                text: text.substring(0, 80),
                postedAt: new Date().toISOString(),
                type: 'daily-insight'
            });
            memory.incrementMetric('totalTweets');
            return { success: true, tweetId: result.id };
        } catch (err) {
            console.error('[twitter-agent] postDailyInsight error:', err.message);
            return { success: false, error: err.message };
        }
    }
}

module.exports = TwitterAgent;

if (require.main === module) {
    const agent = new TwitterAgent();
    agent.run().then(r => console.log('[twitter-agent] Result:', JSON.stringify(r, null, 2)));
}
