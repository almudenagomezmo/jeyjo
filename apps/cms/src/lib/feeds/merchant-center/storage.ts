import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getSupabaseServerClient } from '@/lib/supabase-server'

const BUCKET = 'merchant-feeds'
const OBJECT_PATH = 'latest.xml'
const LOCAL_DIR = path.join(process.cwd(), '.data', 'merchant-feeds')

export type MerchantFeedSnapshotMeta = {
  generatedAt: string
  etag: string
  rowCount: number
}

async function ensureLocalDir(): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true })
}

export function merchantFeedEnabled(): boolean {
  return process.env.MERCHANT_FEED_ENABLED !== 'false'
}

export async function uploadMerchantFeedSnapshot(
  xml: string,
  meta: Omit<MerchantFeedSnapshotMeta, 'etag'> & { etag?: string },
): Promise<MerchantFeedSnapshotMeta> {
  const etag = meta.etag ?? `"${crypto.randomUUID()}"`
  const snapshotMeta: MerchantFeedSnapshotMeta = {
    generatedAt: meta.generatedAt,
    etag,
    rowCount: meta.rowCount,
  }

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(OBJECT_PATH, xml, {
      contentType: 'application/xml',
      upsert: true,
      metadata: {
        generatedAt: snapshotMeta.generatedAt,
        rowCount: String(snapshotMeta.rowCount),
      },
    })
    if (!error) {
      return snapshotMeta
    }
    console.warn('[merchant-feed] Supabase upload failed, using local fallback:', error.message)
  }

  await ensureLocalDir()
  await writeFile(path.join(LOCAL_DIR, OBJECT_PATH), xml, 'utf8')
  await writeFile(
    path.join(LOCAL_DIR, 'meta.json'),
    JSON.stringify(snapshotMeta),
    'utf8',
  )
  return snapshotMeta
}

export async function loadMerchantFeedSnapshot(): Promise<{
  xml: string
  meta: MerchantFeedSnapshotMeta
} | null> {
  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(OBJECT_PATH)
    if (!error && data) {
      const xml = await data.text()
      const generatedAt =
        (data as Blob & { metadata?: Record<string, string> }).metadata?.generatedAt ??
        new Date().toISOString()
      const rowCount = Number(
        (data as Blob & { metadata?: Record<string, string> }).metadata?.rowCount ?? '0',
      )
      return {
        xml,
        meta: {
          generatedAt,
          etag: `"${Buffer.from(xml).toString('base64url').slice(0, 32)}"`,
          rowCount,
        },
      }
    }
  }

  try {
    const xml = await readFile(path.join(LOCAL_DIR, OBJECT_PATH), 'utf8')
    const metaRaw = await readFile(path.join(LOCAL_DIR, 'meta.json'), 'utf8')
    const meta = JSON.parse(metaRaw) as MerchantFeedSnapshotMeta
    return { xml, meta }
  } catch {
    return null
  }
}
