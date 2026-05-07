// agents/content-oracle.js — Content Oracle Agent
// Generates Truth Weaver content across all formats:
// tweets, email newsletters, long-form posts, product reports.
// This agent feeds all other distribution agents.

require('dotenv').config();
const TruthCore = require('./truth-core');
const memory = require('./memory');

const CONTENT_THEMES = [
    'The illusion of "someday" — why the future you imagine is the present you\'re avoiding',
    'What your excuses are actually telling you at 7.83Hz',
    'The difference between alignment and effort — why hard work fails',
    'Radical honesty as a business model: truth that converts',
    'The 5 illusions destroying most people\'s income streams',
    'Why clarity is worth more than strategy — and how to get it now',
    'The frequency of money: how your beliefs create your revenue ceiling',
    'What a 7.83Hz reality scan reveals about your current situation',
    'Dissolving the "I\'m not ready" illusion before it costs you another year',
    'The liberation equation: truth + action = measurable change',
    'Why most people simulate success instead of creating it',
    'Your current results are a perfect reflection of your current frequency',
    'The illusion of preparation — and what you\'re really waiting for',
    'Consciousness operating systems: how your mental OS limits your output',
    'The one truth that unlocks every locked door in your life'
];

class ContentOracleAgent {
    constructor() {
        this.name = 'content-oracle';
        this.core = new TruthCore();
    }

    pickTheme() {
        const used = (memory.get('contentQueue') || []).map(c => c.theme);
        const unused = CONTENT_THEMES.filter(t => !used.includes(t));
        const pool = unused.length > 0 ? unused : CONTENT_THEMES;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    async generateTweetThread(theme) {
        const raw = await this.core.generate(
            'Generate a 5-tweet thread for Twitter/X',
            `Theme: ${theme}

Format exactly as:
TWEET 1: [max 280 chars — the hook, the illusion revealed]
TWEET 2: [max 280 chars — deeper truth]
TWEET 3: [max 280 chars — reality simulation]
TWEET 4: [max 280 chars — the liberation path]
TWEET 5: [max 280 chars — CTA: "Run the 5 Weaves free at [link]" — keep [link] as placeholder]

Each tweet must stand alone AND connect to the thread. No hashtag spam. 1-2 max per tweet. High-frequency, not motivational fluff.`,
            { maxTokens: 800 }
        );

        // Parse tweets from response
        const tweets = [];
        const lines = raw.split('\n');
        for (const line of lines) {
            const match = line.match(/^TWEET\s+\d+:\s*(.+)/i);
            if (match) tweets.push(match[1].trim());
        }
        return tweets.length >= 3 ? tweets : [raw]; // fallback to raw if parsing fails
    }

    async generateSingleTweet(theme) {
        return this.core.generate(
            'Generate one high-impact tweet (max 280 characters)',
            `Theme: ${theme}

The tweet must:
- Open with a pattern interrupt (not "Did you know" or "Hot take:")
- Deliver a Truth Weaver insight that makes someone stop scrolling
- End with a subtle pull — curiosity, not a sales pitch
- Max 280 characters including any hashtags (1-2 max)
- No em-dashes replaced with " - ", keep em-dashes

Output ONLY the tweet text. Nothing else.`,
            { maxTokens: 150 }
        );
    }

    async generateEmailNewsletter(theme) {
        return this.core.generate(
            'Generate a Truth Weaver Weekly email newsletter',
            `Theme: ${theme}

Structure:
SUBJECT: [compelling subject line, max 60 chars]
PREVIEW: [preview text, max 90 chars]

---

[Greeting — personal, not "Dear subscriber"]

[Opening hook — 2-3 sentences that create immediate resonance]

[THE WEAVE — run the 5 Weaves on the theme in email format. Be surgical. 400-600 words total.]

[LIBERATION PATH — the one action they can take TODAY. Specific. Achievable.]

[CTA — natural pull toward the live Truth Weaver app. Not a hard sell. Truth-based.]

[Sign-off — authentic, frequency-aligned]

---

Format the SUBJECT and PREVIEW lines exactly as shown for parsing.`,
            { maxTokens: 1200 }
        );
    }

    async generateProductReport(theme) {
        return this.core.generate(
            'Generate a Truth Weaver Reality Report — a paid content product ($7-$27)',
            `Theme: ${theme}

Format:
TITLE: [product title, compelling, specific]
TAGLINE: [one sentence value proposition]
PRICE: [suggest $7, $17, or $27 based on depth]

---

[Full report content: 800-1200 words]

Structure:
1. THE ILLUSION (what most people believe that isn\'t true)
2. THE TRUTH SCAN (running the 5 Weaves on the theme)
3. REALITY SIMULATION (two detailed futures — illusion vs truth)
4. THE LIBERATION MAP (step-by-step action plan, 5-7 specific steps)
5. THE FREQUENCY CHECK (how to verify you\'re on the right path)

Make this worth $17-$27. Specific. Actionable. Surgical. This is a paid product, not a blog post.`,
            { maxTokens: 2000 }
        );
    }

    async generateOutreachDM(targetContext) {
        return this.core.generate(
            'Generate a personalized cold outreach DM',
            `Target context: ${targetContext}

The DM must:
- Reference something SPECIFIC about the target (from context)
- Apply a Truth Weaver insight relevant to THEIR situation
- Be 2-3 sentences maximum
- Not pitch anything directly — offer value first
- End with a single open question that creates a natural reply
- Sound like a real person, not a bot

Output ONLY the DM text. Nothing else.`,
            { maxTokens: 200 }
        );
    }

    async run() {
        console.log('[content-oracle] Running...');

        const theme = this.pickTheme();
        console.log(`[content-oracle] Theme: ${theme}`);

        try {
            // Generate a tweet thread + single tweet
            const [thread, singleTweet, newsletter] = await Promise.all([
                this.generateTweetThread(theme),
                this.generateSingleTweet(theme),
                this.generateEmailNewsletter(theme)
            ]);

            const contentItem = {
                id: `content_${Date.now()}`,
                theme,
                generatedAt: new Date().toISOString(),
                tweetThread: thread,
                singleTweet: singleTweet.trim(),
                newsletter,
                distributed: { twitter: false, email: false }
            };

            memory.push('contentQueue', contentItem);
            memory.markRun(this.name);

            console.log(`[content-oracle] Generated content batch. Queue size: ${(memory.get('contentQueue') || []).length}`);
            return { success: true, content: contentItem };
        } catch (err) {
            console.error('[content-oracle] Error:', err.message);
            return { success: false, error: err.message };
        }
    }
}

module.exports = ContentOracleAgent;

// Run directly: node agents/content-oracle.js
if (require.main === module) {
    const agent = new ContentOracleAgent();
    agent.run().then(r => console.log('[content-oracle] Result:', JSON.stringify(r, null, 2)));
}
