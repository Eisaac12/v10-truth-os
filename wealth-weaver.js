// Wealth Weaver — Reality Weaver Wealth Protocol v1.0
// VALUE MOVES BEFORE MARKETS PRICE IT. DETECT FIRST. ACT ON YES.

const WEALTH_WEAVER = {
    principle: "VALUE MOVES BEFORE MARKETS PRICE IT. DETECT FIRST. ACT ON YES.",
    belief:    "Money is energy. Opportunities are frequencies. Scan the field.",

    protocols: [
        { id: 1, name: "FIELD SCAN",        description: "Detect value gradients before markets price them" },
        { id: 2, name: "OPPORTUNITY FRAME", description: "Structure the opportunity with Reality Weaver clarity" },
        { id: 3, name: "EFFORT/REWARD MAP", description: "Honest assessment of scale and effort required" },
        { id: 4, name: "TIMING SIGNAL",     description: "Why this window exists now" },
        { id: 5, name: "ACTION THRESHOLD",  description: "The one move that opens the door" }
    ],

    categories: [
        'digital-product', 'service', 'content', 'community', 'investment',
        'arbitrage', 'consulting', 'licensing', 'partnership', 'infrastructure'
    ],
    effortLevels: ['minimal', 'low', 'medium', 'high'],
    timeHorizons: ['immediate', 'short-term', 'medium-term', 'long-term'],

    systemPrompt: `You are the Wealth Weaver — a continuous value-detection agent operating across the full stack of reality.

Your function: scan the field for value gradients before markets price them in. You see opportunity in information asymmetry, timing windows, underserved needs, and emerging frequencies.

Rules:
- Good purposes only. Generate wealth through creation and value delivery, not exploitation.
- Money is energy, not identity. Present opportunities without attachment.
- Every opportunity must be grounded in real-world action, not abstraction.
- Scale range: $0 startup to $500M outcomes. Both ends are valid.
- One opportunity per scan. Never hedge with multiple options.

When the mode is "scan", output ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "title": "Short memorable name for this opportunity",
  "valueGradient": "One sentence: what value gap or timing window exists right now",
  "opportunity": "2-3 sentences: what the opportunity is and how to capture it",
  "whyNow": "One sentence: why this window exists at this moment",
  "effortLevel": "minimal|low|medium|high",
  "timeHorizon": "immediate|short-term|medium-term|long-term",
  "scaleMin": "$X",
  "scaleMax": "$Y",
  "category": "digital-product|service|content|community|investment|arbitrage|consulting|licensing|partnership|infrastructure",
  "firstMove": "The single most concrete next action to begin"
}

When the mode is "execute" (user approved an opportunity), output 5 concrete next steps as a numbered list:

NEXT STEPS — [opportunity title]

1. [Specific action — do today]
2. [Specific action — do this week]
3. [Specific action — do this week]
4. [Specific action — do within 30 days]
5. [Specific action — do within 60 days]

Be specific, time-bound, and achievable with existing resources.

When LIVE MARKET SIGNALS are provided in the prompt, prioritize them. The signals show what the startup/tech community is discussing RIGHT NOW. Surface an opportunity that connects to these real current trends — this is what makes the scan live and grounded in the field's actual state.

FREQUENCY CHECK: Is this grounded in real-world action? Is this ethical and legal? Is this one specific opportunity?`,

    localOpportunities: [
        {
            title: "Weekly AI Tools Digest Newsletter",
            valueGradient: "AI tool launches are outpacing curation — the gap between signal and noise is monetizable now.",
            opportunity: "Launch a weekly curated newsletter covering the 5 most useful new AI tools. Substack free tier, no-cost start. Monetize with sponsorships at 1K subscribers.",
            whyNow: "AI releases are accelerating weekly; curated signal beats raw noise for a growing audience.",
            effortLevel: "low",
            timeHorizon: "short-term",
            scaleMin: "$500/mo",
            scaleMax: "$15K/mo",
            category: "content",
            firstMove: "Write and publish issue #1 today on Substack. Send it to 10 existing contacts personally."
        },
        {
            title: "Notion Template Marketplace Play",
            valueGradient: "Notion users buy templates at $10–$100 each; supply lags demand in specific professional niches.",
            opportunity: "Design and sell 3 high-quality Notion templates for a specific professional niche. List on Gumroad and Notionery.",
            whyNow: "Remote work normalization has driven Notion adoption to 30M+ users with willingness to pay for setup time savings.",
            effortLevel: "low",
            timeHorizon: "immediate",
            scaleMin: "$200/mo",
            scaleMax: "$5K/mo",
            category: "digital-product",
            firstMove: "Identify one Notion template you already use daily. Publish it on Gumroad today for $19."
        },
        {
            title: "B2B Lead Outreach as a Service",
            valueGradient: "SMBs need outbound but lack the time and system — pay-per-result model wins at this moment.",
            opportunity: "Offer done-for-you cold outreach: you handle targeting, copy, sending, and reporting. Charge $500–$2K/month per client on 90-day retainers.",
            whyNow: "AI tools (Clay, Apollo) have reduced per-lead cost 10x, making this service highly profitable at lower client budgets.",
            effortLevel: "medium",
            timeHorizon: "short-term",
            scaleMin: "$1K/mo",
            scaleMax: "$20K/mo",
            category: "service",
            firstMove: "DM 5 SMB founders in your network today: 'Would you pay $500/mo to have someone else run your outbound?'"
        },
        {
            title: "Niche Professional Community on Skool",
            valueGradient: "Niche professional communities command $50–$200/month memberships when they solve a real ongoing problem.",
            opportunity: "Launch a Skool community for a professional niche you have credibility in. Sell access to weekly office hours, curated resources, and peer connection.",
            whyNow: "Skool's algorithm actively surfaces new communities; early communities in untapped niches grow faster with less ad spend.",
            effortLevel: "medium",
            timeHorizon: "short-term",
            scaleMin: "$2K/mo",
            scaleMax: "$50K/mo",
            category: "community",
            firstMove: "Create your Skool community today (free). DM your top 20 professional contacts to join the founding member cohort."
        },
        {
            title: "Fractional CMO for Early-Stage Startups",
            valueGradient: "Seed-stage startups need marketing leadership but can't afford a full-time CMO — fractional is the bridge.",
            opportunity: "Offer 10 hours/week of marketing leadership to 2–4 early-stage startups at $3K–$8K/month each. No hiring process, no equity give-up.",
            whyNow: "Startup hiring has slowed but marketing needs haven't — fractional engagements are up 40% YoY.",
            effortLevel: "medium",
            timeHorizon: "immediate",
            scaleMin: "$6K/mo",
            scaleMax: "$30K/mo",
            category: "consulting",
            firstMove: "Post one LinkedIn article today: 'Why early-stage startups hire fractional CMOs' and end with a call to book a 30-min call."
        },
        {
            title: "White-Label AI Report Generator for Agencies",
            valueGradient: "Marketing agencies need client-facing AI analysis reports but lack technical capacity to build them in-house.",
            opportunity: "Build a simple web app that generates branded AI-powered analysis reports (SEO audits, competitor analysis). License to agencies for $500–$2K/month.",
            whyNow: "Claude and GPT APIs have made this buildable in 2 weeks; agencies pay for white-label AI tools that make them look cutting-edge.",
            effortLevel: "high",
            timeHorizon: "medium-term",
            scaleMin: "$5K/mo",
            scaleMax: "$100K/mo",
            category: "infrastructure",
            firstMove: "Identify one agency in your network. Ask what report they manually create every week. Build that one report first."
        },
        {
            title: "Faceless YouTube Channel in High-CPM Niche",
            valueGradient: "AI video generation tools have slashed production cost 90%; sponsorship rates remain high for niche audiences.",
            opportunity: "Launch a faceless YouTube channel in a high-CPM niche (finance, tech, productivity). Use AI video tools for production. Monetize with AdSense and direct sponsorships.",
            whyNow: "YouTube's algorithm is promoting new channels in underserved niches; AI tools mean one person outputs what a team used to produce.",
            effortLevel: "medium",
            timeHorizon: "medium-term",
            scaleMin: "$1K/mo",
            scaleMax: "$30K/mo",
            category: "content",
            firstMove: "Record and upload your first video today. Topic: the thing you know better than 99% of people. Length: 8–12 minutes."
        },
        {
            title: "API Wrapper SaaS for a Niche Use Case",
            valueGradient: "Developers and non-technical users pay monthly for a cleaned-up API wrapper that solves one specific workflow problem.",
            opportunity: "Identify one painful API integration (tax calculation, real estate data, legal document parsing). Build a clean REST wrapper. Charge $49–$199/month.",
            whyNow: "AI-assisted coding has made solo SaaS development 5x faster; the gap between API idea and shipped product is now weeks, not months.",
            effortLevel: "high",
            timeHorizon: "medium-term",
            scaleMin: "$2K/mo",
            scaleMax: "$200K/mo",
            category: "infrastructure",
            firstMove: "Identify one API you wish was simpler. Write the spec for the wrapper today. Start the Stripe billing integration tomorrow."
        }
    ],

    // Returns a local opportunity weighted by preference history
    scanLocally(preferences) {
        let candidates = [...this.localOpportunities];

        if (preferences && preferences.categories) {
            const avoid = Object.entries(preferences.categories)
                .filter(([, v]) => (v.yes || 0) === 0 && (v.no || 0) >= 2)
                .map(([k]) => k);
            if (avoid.length > 0) {
                const filtered = candidates.filter(o => !avoid.includes(o.category));
                if (filtered.length > 0) candidates = filtered;
            }
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    },

    // Converts stored preferences into a Claude prompt context string
    buildPreferenceContext(preferences) {
        if (!preferences || !preferences.categories) return '';
        const cats = preferences.categories;
        const preferred = Object.entries(cats)
            .filter(([, v]) => (v.yes || 0) >= 2 && (v.yes || 0) > (v.no || 0))
            .map(([k]) => k);
        const avoid = Object.entries(cats)
            .filter(([, v]) => (v.no || 0) >= 2 && (v.no || 0) > (v.yes || 0))
            .map(([k]) => k);
        const effortPref = preferences.effortLevels
            ? Object.entries(preferences.effortLevels)
                .filter(([, v]) => (v.yes || 0) >= 2 && (v.yes || 0) > (v.no || 0))
                .map(([k]) => k)
            : [];

        let ctx = '';
        if (preferred.length)   ctx += `\nPreferred categories (approved before): ${preferred.join(', ')}`;
        if (avoid.length)       ctx += `\nAvoid categories (rejected before): ${avoid.join(', ')}`;
        if (effortPref.length)  ctx += `\nPreferred effort level: ${effortPref.join(', ')}`;
        return ctx;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEALTH_WEAVER;
}
