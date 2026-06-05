import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getSupabaseServerClient } from '@/lib/supabase-server'

const BUCKET = 'erp-imports'
const LOCAL_DIR = path.join(process.cwd(), '.data', 'erp-imports')

function storagePath(importId: string): string {
  return `${importId}.xlsx`
}

async function ensureLocalDir(): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true })
}

export async function persistImportFile(buffer: Buffer): Promise<string> {
  const importId = crypto.randomUUID()
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath(importId), buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      })
    if (!error) {
      return importId
    }
    console.warn('[catalog-import] Supabase storage upload failed, using local fallback:', error.message)
  }

  await ensureLocalDir()
  await writeFile(path.join(LOCAL_DIR, storagePath(importId)), buffer)
  return importId
}

export async function loadImportFile(importId: string): Promise<Buffer> {
  const safeId = importId.replace(/[^a-zA-Z0-9-]/g, '')
  if (!safeId) {
    throw new Error('Invalid importId')
  }

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath(safeId))
    if (!error && data) {
      return Buffer.from(await data.arrayBuffer())
    }
  }

  const localPath = path.join(LOCAL_DIR, storagePath(safeId))
  return readFile(localPath)
}
