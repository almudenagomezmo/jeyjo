import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

export const RELATED_PRODUCTS_LIMIT = 8
export const RELATED_PRODUCTS_SYNC_CONTEXT = 'relatedProductsSync'

type RelatedRef = Product['relatedProducts']

function relationId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (typeof value === 'object' && 'id' in value && value.id != null) return String(value.id)
  return null
}

export function normalizeRelatedProductIds(related: RelatedRef | undefined): string[] {
  if (!related?.length) return []
  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of related) {
    const id = relationId(item)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function diffRelatedProductIds(
  previous: string[],
  next: string[],
): { added: string[]; removed: string[] } {
  const prevSet = new Set(previous)
  const nextSet = new Set(next)
  const added = next.filter((id) => !prevSet.has(id))
  const removed = previous.filter((id) => !nextSet.has(id))
  return { added, removed }
}

export function addRelatedProductId(
  existing: string[],
  productId: string,
  selfId: string,
  limit = RELATED_PRODUCTS_LIMIT,
): string[] {
  if (productId === selfId || existing.includes(productId)) return existing
  const merged = [...existing, productId]
  return merged.slice(0, limit)
}

export function removeRelatedProductId(existing: string[], productId: string): string[] {
  return existing.filter((id) => id !== productId)
}

function usesDraftLayer(req: PayloadRequest): boolean {
  const query = req.query as Record<string, unknown> | undefined
  if (query?.draft === 'true' || query?.draft === true) return true
  return req.context?.draft === true
}

async function readRelatedProductIds(
  req: PayloadRequest,
  productId: string,
): Promise<string[]> {
  const doc = await req.payload.findByID({
    collection: 'products',
    id: productId,
    depth: 0,
    draft: usesDraftLayer(req),
    overrideAccess: true,
    req,
  })
  return normalizeRelatedProductIds(doc.relatedProducts)
}

async function writeRelatedProductIds(
  req: PayloadRequest,
  productId: string,
  relatedProducts: string[],
): Promise<void> {
  const syncReq = req
  syncReq.context = {
    ...syncReq.context,
    [RELATED_PRODUCTS_SYNC_CONTEXT]: true,
  }

  await req.payload.update({
    collection: 'products',
    id: productId,
    data: { relatedProducts },
    draft: usesDraftLayer(req),
    overrideAccess: true,
    req: syncReq,
  })
}

async function syncReciprocalRelatedProducts({
  req,
  selfId,
  added,
  removed,
}: {
  req: PayloadRequest
  selfId: string
  added: string[]
  removed: string[]
}): Promise<void> {
  for (const targetId of added) {
    if (targetId === selfId) continue
    const current = await readRelatedProductIds(req, targetId)
    const next = addRelatedProductId(current, selfId, targetId)
    if (next.length === current.length && next.every((id, index) => id === current[index])) continue
    await writeRelatedProductIds(req, targetId, next)
  }

  for (const targetId of removed) {
    if (targetId === selfId) continue
    const current = await readRelatedProductIds(req, targetId)
    const next = removeRelatedProductId(current, selfId)
    if (next.length === current.length) continue
    await writeRelatedProductIds(req, targetId, next)
  }
}

export const relatedProductsAfterChange: CollectionAfterChangeHook<Product> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (req.context?.[RELATED_PRODUCTS_SYNC_CONTEXT] === true) return doc
  if (operation !== 'create' && operation !== 'update') return doc

  const selfId = relationId(doc.id)
  if (!selfId) return doc

  const nextIds = normalizeRelatedProductIds(doc.relatedProducts)
  const previousIds = normalizeRelatedProductIds(previousDoc?.relatedProducts)
  const { added, removed } = diffRelatedProductIds(previousIds, nextIds)

  if (added.length === 0 && removed.length === 0) return doc

  await syncReciprocalRelatedProducts({ req, selfId, added, removed })
  return doc
}

export const relatedProductsAfterDelete: CollectionAfterDeleteHook<Product> = async ({
  doc,
  req,
}) => {
  if (req.context?.[RELATED_PRODUCTS_SYNC_CONTEXT] === true) return

  const selfId = relationId(doc.id)
  if (!selfId) return

  const linkedIds = normalizeRelatedProductIds(doc.relatedProducts)
  if (linkedIds.length === 0) return

  await syncReciprocalRelatedProducts({
    req,
    selfId,
    added: [],
    removed: linkedIds,
  })
}
