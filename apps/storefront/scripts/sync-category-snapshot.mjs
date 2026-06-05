#!/usr/bin/env node
/**
 * Export Payload categories to apps/storefront/data/category-tree.snapshot.json
 * Usage: pnpm sync:categories (from repo root or storefront package)
 *
 * Reads CMS_URL / CMS_INTERNAL_URL from env or apps/storefront/.env
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const storefrontRoot = join(__dirname, '..')
const snapshotPath = join(storefrontRoot, 'data', 'category-tree.snapshot.json')

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] == null) {
        process.env[key] = value
      }
    }
  } catch {
    // optional .env
  }
}

loadEnvFile(join(storefrontRoot, '.env'))
loadEnvFile(join(storefrontRoot, '.env.local'))

function cmsBaseUrl() {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

async function main() {
  const base = cmsBaseUrl()
  if (!base) {
    console.error('Set CMS_URL or CMS_INTERNAL_URL (see apps/storefront/.env.example)')
    process.exit(1)
  }

  const url = `${base.replace(/\/$/, '')}/api/categories?depth=0&limit=500&sort=sortOrder`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })

  if (!res.ok) {
    console.error(`CMS categories fetch failed: ${res.status}`)
    process.exit(1)
  }

  const body = await res.json()
  const docs = body.docs ?? []

  if (docs.length === 0) {
    console.error('CMS returned zero categories; snapshot not updated.')
    process.exit(1)
  }

  const snapshot = {
    syncedAt: new Date().toISOString(),
    source: base.replace(/\/$/, ''),
    docs: docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      parent: doc.parent ?? null,
      sortOrder: doc.sortOrder ?? null,
      homeGlyph: doc.homeGlyph ?? null,
    })),
  }

  mkdirSync(dirname(snapshotPath), { recursive: true })
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  console.info(`Wrote ${docs.length} categories to ${snapshotPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
