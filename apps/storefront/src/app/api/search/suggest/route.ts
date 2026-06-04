import { NextResponse } from 'next/server'

import { logSuggestTimings, runSuggestSearch } from '@/lib/search/run-suggest-search'
import type { SuggestResponse } from '@/lib/search/types'
import { isQdrantConfigured } from '@/lib/search/vector-search'

export async function POST(request: Request) {
  let body: { q?: string }
  try {
    body = (await request.json()) as { q?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const q = typeof body.q === 'string' ? body.q.trim() : ''
  if (q.length < 3) {
    return NextResponse.json(
      { error: 'Query must be at least 3 characters' },
      { status: 400 },
    )
  }

  if (!isQdrantConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        products: [],
        categories: [],
        latencyMs: 0,
      } satisfies SuggestResponse)
    }
    return NextResponse.json({ error: 'Search unavailable', fallback: false }, { status: 503 })
  }

  try {
    const { body: response, timings } = await runSuggestSearch(q)
    logSuggestTimings(q, timings)
    return NextResponse.json(response)
  } catch (err) {
    console.error('[search/suggest] error', err)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Search unavailable', fallback: false }, { status: 503 })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 },
    )
  }
}
