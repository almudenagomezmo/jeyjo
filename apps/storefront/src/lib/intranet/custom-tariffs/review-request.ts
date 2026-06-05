import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { createPriceReviewQuote, fetchCustomerQuotes } from '@/lib/quotes/payload-quote'

import {
  findExpiredSpecialPrice,
  priceReviewObservation,
  PRICE_REVIEW_NOTE_PREFIX,
} from './service'

const DEDUPE_DAYS = 7

function observationMatchesSku(notes: string | null | undefined, sku: string): boolean {
  if (!notes?.trim()) return false
  return notes.trim() === priceReviewObservation(sku)
}

export async function hasRecentPriceReviewRequest(
  customerId: string,
  sku: string,
): Promise<boolean> {
  const quotes = await fetchCustomerQuotes(customerId, { includeNotes: true })
  const cutoff = Date.now() - DEDUPE_DAYS * 24 * 60 * 60 * 1000
  return quotes.some((q) => {
    if (q.status !== 'requested') return false
    const created = new Date(q.createdAt).getTime()
    if (created < cutoff) return false
    return observationMatchesSku(q.customerNotes, sku)
  })
}

export async function submitPriceReviewRequest(
  customerId: string,
  sku: string,
): Promise<{ quoteNumber: string } | { error: string; status: number }> {
  const trimmed = sku.trim()
  if (!trimmed) {
    return { error: 'SKU required', status: 400 }
  }

  const expired = await findExpiredSpecialPrice(customerId, trimmed)
  if (!expired) {
    return { error: 'Price is not expired or not found for this customer', status: 400 }
  }

  if (await hasRecentPriceReviewRequest(customerId, trimmed)) {
    return {
      error: `Ya existe una solicitud de revisión para ${trimmed} en los últimos ${DEDUPE_DAYS} días`,
      status: 409,
    }
  }

  const products = await fetchPublicProductsBySkus([trimmed])
  const productName = products[0]?.title ?? trimmed
  const notes = priceReviewObservation(trimmed)

  const created = await createPriceReviewQuote({
    customerId,
    sku: trimmed,
    productName,
    customerNotes: notes,
  })

  if (!created) {
    return { error: 'No se pudo registrar la solicitud', status: 503 }
  }

  return { quoteNumber: created.quoteNumber }
}

export { PRICE_REVIEW_NOTE_PREFIX }
