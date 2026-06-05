import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { GlyphKind } from '@/lib/types'

export interface CmsCategoryDoc {
  id: string | number
  title: string
  slug: string
  sortOrder?: number | null
  parent?: string | number | { id: string | number } | null
  homeGlyph?: GlyphKind | null
}

export interface CategoryTreeSnapshot {
  syncedAt: string
  source: string
  docs: CmsCategoryDoc[]
}

export const CATEGORY_SNAPSHOT_RELATIVE_PATH = join('data', 'category-tree.snapshot.json')

function snapshotPath(): string {
  return join(process.cwd(), CATEGORY_SNAPSHOT_RELATIVE_PATH)
}

function isGlyphKind(value: unknown): value is GlyphKind {
  return typeof value === 'string' && value.length > 0
}

function normalizeDoc(raw: unknown): CmsCategoryDoc | null {
  if (!raw || typeof raw !== 'object') return null
  const doc = raw as Record<string, unknown>
  const slug = doc.slug
  const title = doc.title
  const id = doc.id
  if (typeof slug !== 'string' || !slug.trim()) return null
  if (typeof title !== 'string' || !title.trim()) return null
  if (id == null) return null

  return {
    id: id as string | number,
    title,
    slug,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
    parent: (doc.parent ?? null) as CmsCategoryDoc['parent'],
    homeGlyph: isGlyphKind(doc.homeGlyph) ? doc.homeGlyph : undefined,
  }
}

export function readCategorySnapshot(): CategoryTreeSnapshot | null {
  try {
    const raw = readFileSync(snapshotPath(), 'utf8')
    const parsed = JSON.parse(raw) as {
      syncedAt?: unknown
      source?: unknown
      docs?: unknown[]
    }

    const docs = (parsed.docs ?? [])
      .map(normalizeDoc)
      .filter((doc): doc is CmsCategoryDoc => doc != null)

    if (docs.length === 0) return null

    return {
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : '',
      source: typeof parsed.source === 'string' ? parsed.source : '',
      docs,
    }
  } catch {
    return null
  }
}
