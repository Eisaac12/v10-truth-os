// Shared Notion context fetcher — used by all Vercel serverless functions
// Reads NOTION_API_KEY + NOTION_PAGE_ID from environment variables
// Caches fetched content for 5 minutes to avoid redundant API calls

let notionCache = { content: null, fetchedAt: 0 };

async function fetchNotionContext() {
    const apiKey = process.env.NOTION_API_KEY;
    const pageId = process.env.NOTION_PAGE_ID;
    if (!apiKey || !pageId) return null;

    const now = Date.now();
    if (notionCache.content && (now - notionCache.fetchedAt) < 5 * 60 * 1000) {
        return notionCache.content;
    }

    try {
        const res = await fetch(
            `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!res.ok) return null;

        const data = await res.json();
        const lines = [];

        for (const block of (data.results || [])) {
            const type = block.type;
            const blockData = block[type];
            if (!blockData) continue;
            const richText = blockData.rich_text || blockData.text || [];
            const text = richText.map(t => t.plain_text || '').join('');
            if (text.trim()) lines.push(text);
        }

        const content = lines.slice(0, 100).join('\n') || null;
        notionCache = { content, fetchedAt: now };
        return content;
    } catch {
        return null;
    }
}

function injectNotionContext(systemPrompt, notionContent) {
    if (!notionContent) return systemPrompt;
    return `${systemPrompt}\n\n---\nNOTION WORKSPACE CONTEXT (live):\n${notionContent}\n---`;
}

module.exports = { fetchNotionContext, injectNotionContext };
