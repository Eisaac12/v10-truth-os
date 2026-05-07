import { NextRequest, NextResponse } from 'next/server'
import { weave, type AgentMode, type Message } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { input, history = [], mode = 'truth-weaver' } = await req.json()

    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'Input is required.' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Running in local mode.' },
        { status: 503 }
      )
    }

    const response = await weave(input.trim(), history as Message[], mode as AgentMode)
    return NextResponse.json({ success: true, response, mode, frequency: '7.83Hz' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/weave]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
