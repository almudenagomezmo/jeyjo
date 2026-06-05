import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

import { roundQtyToPack } from './pack-qty'
import { resolveReferenceIncludingWildcard } from './resolve-reference'
import type { QuickOrderLinePreview } from './types'

function normalizeQty(qty: number): number {
  const n = Math.floor(Number(qty))
  if (!Number.isFinite(n) || n < 1) return 0
  return n
}

export async function buildQuickOrderPreview(
  reference: string,
  rawQty: number,
  customerId: string | null,
): Promise<QuickOrderLinePreview> {
  const inputReference = reference.trim()
  const qtyInput = normalizeQty(rawQty)

  if (!inputReference) {
    return {
      inputReference: '',
      sku: null,
      productSlug: null,
      title: null,
      imageUrl: null,
      qty: 0,
      packUnit: 1,
      matchedBy: null,
      status: 'not_found',
      quote: null,
    }
  }

  if (qtyInput < 1) {
    return {
      inputReference,
      sku: null,
      productSlug: null,
      title: null,
      imageUrl: null,
      qty: 0,
      packUnit: 1,
      matchedBy: null,
      status: 'invalid_qty',
      quote: null,
    }
  }

  const { resolved, isWildcard } = await resolveReferenceIncludingWildcard(inputReference)

  if (isWildcard && resolved) {
    return {
      inputReference,
      sku: resolved.sku,
      productSlug: resolved.slug,
      title: resolved.doc.title ?? null,
      imageUrl: resolved.doc.thumbnailUrl ?? null,
      qty: qtyInput,
      packUnit: resolved.doc.packUnit && resolved.doc.packUnit > 0 ? resolved.doc.packUnit : 1,
      matchedBy: resolved.matchedBy,
      status: 'wildcard',
      quote: null,
    }
  }

  if (!resolved) {
    return {
      inputReference,
      sku: null,
      productSlug: null,
      title: null,
      imageUrl: null,
      qty: qtyInput,
      packUnit: 1,
      matchedBy: null,
      status: 'not_found',
      quote: null,
    }
  }

  const packUnit =
    resolved.doc.packUnit != null && resolved.doc.packUnit > 0 ? resolved.doc.packUnit : 1
  const qty = roundQtyToPack(qtyInput, packUnit)
  const quotes = await resolvePriceQuotesBatch([resolved.sku], customerId)
  const quote = quotes[resolved.sku]

  if (!quote) {
    return {
      inputReference,
      sku: resolved.sku,
      productSlug: resolved.slug,
      title: resolved.doc.title ?? null,
      imageUrl: resolved.doc.thumbnailUrl ?? null,
      qty,
      packUnit,
      matchedBy: resolved.matchedBy,
      status: 'not_found',
      quote: null,
    }
  }

  return {
    inputReference,
    sku: resolved.sku,
    productSlug: resolved.slug,
    title: resolved.doc.title ?? null,
    imageUrl: resolved.doc.thumbnailUrl ?? null,
    qty,
    packUnit,
    matchedBy: resolved.matchedBy,
    status: 'ok',
    quote: {
      netUnit: quote.netUnit,
      grossUnit: quote.grossUnit,
      appliedRule: quote.appliedRule,
      label: quote.label,
    },
  }
}
