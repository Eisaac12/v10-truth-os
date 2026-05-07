import { NextRequest, NextResponse } from 'next/server'
import { anthropic, TRUTH_WEAVER_SYSTEM } from '@/lib/anthropic'

const PROMPTS: Record<string, (theme: string) => string> = {
  tweet: theme => `Generate one high-impact tweet (max 280 characters) on this theme: ${theme}

Rules: Pattern-interrupt opening. No "Hot take:" or "Did you know". End with curiosity pull. 1-2 hashtags max. Output ONLY the tweet text.`,

  thread: theme => `Generate a 5-tweet thread on: ${theme}

Format exactly:
TWEET 1: [hook — max 280 chars]
TWEET 2: [deeper truth — max 280 chars]
TWEET 3: [reality simulation — max 280 chars]
TWEET 4: [liberation path — max 280 chars]
TWEET 5: [CTA to truthweaver — max 280 chars]`,

  email: theme => `Generate a Truth Weaver Weekly newsletter on: ${theme}

Format:
SUBJECT: [max 60 chars]
PREVIEW: [max 90 chars]
---
[Body: 400-600 words, 5-Weave structure, strong CTA]`,

  report: theme => `Generate a Truth Weaver Reality Report (paid PDF, $7-$27) on: ${theme}

Format:
TITLE: [compelling title]
TAGLINE: [one sentence]
PRICE: [7, 17, or 27]
---
[Full report: 800-1200 words with: 1. THE ILLUSION, 2. TRUTH SCAN, 3. REALITY SIMULATION, 4. LIBERATION MAP, 5. FREQUENCY CHECK]`
}

export async function POST(req: NextRequest) {
  const { type, theme } = await req.json()

  if (!type || !theme) {
    return NextResponse.json({ error: 'type and theme are required' }, { status: 400 })
  }

  const promptFn = PROMPTS[type as keyof typeof PROMPTS]
  if (!promptFn) {
    return NextResponse.json({ error: `Unknown content type: ${type}` }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 503 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: type === 'report' ? 2500 : 1200,
      system: TRUTH_WEAVER_SYSTEM,
      messages: [{ role: 'user', content: promptFn(theme) }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ success: true, content, type, theme })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
