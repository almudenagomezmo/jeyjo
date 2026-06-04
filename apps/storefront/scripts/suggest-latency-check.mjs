#!/usr/bin/env node
/**
 * Staging latency check for predictive suggest (RF-009 / RNF-002).
 * Usage: node scripts/suggest-latency-check.mjs https://staging.example.com boli
 *
 * Warms the embedding model with one request, then runs 10 sequential suggests
 * and reports p95 latency from response latencyMs.
 */
const baseUrl = (process.argv[2] ?? process.env.STOREFRONT_URL ?? '').replace(/\/$/, '')
const query = process.argv[3] ?? 'boli'

if (!baseUrl) {
  console.error('Usage: node scripts/suggest-latency-check.mjs <storefront-url> [query]')
  process.exit(1)
}

async function suggestOnce() {
  const started = performance.now()
  const res = await fetch(`${baseUrl}/api/search/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query }),
  })
  const body = await res.json().catch(() => ({}))
  const clientMs = performance.now() - started
  return {
    status: res.status,
    serverMs: typeof body.latencyMs === 'number' ? body.latencyMs : null,
    clientMs,
  }
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

async function main() {
  console.info(`Warm-up: ${baseUrl} q="${query}"`)
  await suggestOnce()

  const samples = []
  for (let i = 0; i < 10; i += 1) {
    const sample = await suggestOnce()
    samples.push(sample)
    console.info(`  #${i + 1} status=${sample.status} serverMs=${sample.serverMs} clientMs=${Math.round(sample.clientMs)}`)
  }

  const serverTimes = samples.map((s) => s.serverMs).filter((n) => n != null)
  if (serverTimes.length === 0) {
    console.warn('No server latencyMs in responses — check QDRANT_URL and indexed data.')
    process.exit(1)
  }

  const p95 = percentile(serverTimes, 95)
  console.info(`p95 server latencyMs: ${p95} (target <150)`)
  process.exit(p95 < 150 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
