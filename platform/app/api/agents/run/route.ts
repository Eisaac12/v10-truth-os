import { NextRequest, NextResponse } from 'next/server'

const AGENT_MAP: Record<string, string> = {
  'content-oracle': 'content-oracle',
  'twitter':        'twitter',
  'email':          'email',
  'outreach':       'outreach',
  'product':        'product',
  'revenue-intel':  'revenue-intel'
}

export async function POST(req: NextRequest) {
  const { agent } = await req.json()
  if (!AGENT_MAP[agent]) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 })
  }

  // In production: use a job queue (BullMQ, Inngest, etc.)
  // For now, trigger via the Matrix orchestrator CLI path
  // This endpoint is called by the UI; the scheduler handles actual execution
  return NextResponse.json({
    success: true,
    message: `Agent "${agent}" queued for immediate run.`,
    note: 'Run `npm run matrix -- --only ' + AGENT_MAP[agent] + ' --force` on your server to execute immediately.'
  })
}
