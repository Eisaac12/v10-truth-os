// api/_market-signals.js — Live Market Signal Fetcher
// Feeds real-time trending data into Wealth Weaver scans.
// Sources: HackerNews (front page) + Reddit (r/entrepreneur, r/startups, r/sidehustle)
// Cache TTL: 30 minutes — shared across requests within the same process.

let marketCache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 30 * 60 * 1000;

async function fetchHackerNews() {
    const res = await fetch(
        'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=8',
        { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HN API ${res.status}`);
    const data = await res.json();
    return (data.hits || []).map(h => h.title).filter(Boolean).slice(0, 8);
}

async function fetchReddit(subreddit) {
    const res = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=6`,
        {
            headers: { 'User-Agent': 'TRUTHOS-WealthWeaver/1.0' },
            signal: AbortSignal.timeout(5000)
        }
    );
    if (!res.ok) throw new Error(`Reddit r/${subreddit} ${res.status}`);
    const data = await res.json();
    return (data.data?.children || [])
        .filter(c => !c.data.stickied)
        .slice(0, 3)
        .map(c => c.data.title);
}

async function fetchMarketSignals() {
    const now = Date.now();
    if (marketCache.data && (now - marketCache.fetchedAt) < CACHE_TTL) {
        return marketCache.data;
    }

    const [hn, r1, r2, r3] = await Promise.allSettled([
        fetchHackerNews(),
        fetchReddit('entrepreneur'),
        fetchReddit('startups'),
        fetchReddit('sidehustle')
    ]);

    const hnTitles     = hn.status === 'fulfilled' ? hn.value : [];
    const redditTitles = [
        ...(r1.status === 'fulfilled' ? r1.value : []),
        ...(r2.status === 'fulfilled' ? r2.value : []),
        ...(r3.status === 'fulfilled' ? r3.value : [])
    ];

    const hnOk     = hn.status === 'fulfilled' && hnTitles.length > 0;
    const redditOk = (r1.status === 'fulfilled' || r2.status === 'fulfilled' || r3.status === 'fulfilled') && redditTitles.length > 0;

    console.log(`[Market Signals] Fetched ${hnTitles.length} HN + ${redditTitles.length} Reddit signals`);

    const signals = {
        hackerNews: hnTitles,
        reddit:     redditTitles,
        fetchedAt:  new Date().toISOString(),
        sources:    { hackerNews: hnOk, reddit: redditOk }
    };

    marketCache = { data: signals, fetchedAt: now };
    return signals;
}

function injectMarketSignals(prompt, signals) {
    if (!signals) return prompt;
    const hasHN     = signals.hackerNews && signals.hackerNews.length > 0;
    const hasReddit = signals.reddit && signals.reddit.length > 0;
    if (!hasHN && !hasReddit) return prompt;

    let ctx = '\n\n---\nLIVE MARKET SIGNALS (real-time — use these to ground your scan):\n';

    if (hasHN) {
        ctx += '\nHackerNews front page (what tech/startup community is reading RIGHT NOW):\n';
        signals.hackerNews.forEach(t => { ctx += `• ${t}\n`; });
    }

    if (hasReddit) {
        ctx += '\nReddit r/entrepreneur + r/startups + r/sidehustle trending RIGHT NOW:\n';
        signals.reddit.forEach(t => { ctx += `• ${t}\n`; });
    }

    ctx += '\nINSTRUCTION: Surface an opportunity that connects to what is actually moving in these communities today. Your scan should be grounded in these real signals, not generic patterns.\n---';

    return prompt + ctx;
}

module.exports = { fetchMarketSignals, injectMarketSignals };
