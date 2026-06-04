import { resolveProductByReference } from '@/lib/catalog/resolve-product-by-reference'
import { isWildcardPurchaseSku } from '@/lib/intranet/purchase-history/wildcard'

export type QuickOrderRowStatus = 'ok' | 'not_found' | 'invalid_qty' | 'wildcard'

export type QuickOrderValidateRow = {
  ref: string
  qty: number
  rowIndex?: number
  status: QuickOrderRowStatus
  sku?: string
  slug?: string
  name?: string
}

export async function validateQuickOrderRefs(
  items: Array<{ ref: string; qty: number; rowIndex?: number }>,
): Promise<QuickOrderValidateRow[]> {
  const out: QuickOrderValidateRow[] = []

  for (const item of items) {
    const ref = item.ref.trim()
    const qty = Math.floor(Number(item.qty))
    const base = { ref, qty, rowIndex: item.rowIndex }

    if (!ref) {
      out.push({ ...base, status: 'not_found' })
      continue
    }
    if (qty <= 0 || !Number.isFinite(qty)) {
      out.push({ ...base, status: 'invalid_qty' })
      continue
    }
    if (isWildcardPurchaseSku(ref)) {
      out.push({ ...base, status: 'wildcard' })
      continue
    }

    const resolved = await resolveProductByReference(ref)
    if (!resolved) {
      out.push({ ...base, status: 'not_found' })
      continue
    }

    const slug = resolved.doc.slug?.trim()
    if (!slug) {
      out.push({ ...base, status: 'not_found' })
      continue
    }

    out.push({
      ...base,
      status: 'ok',
      sku: resolved.sku,
      slug,
      name: resolved.doc.title?.trim() || resolved.sku,
    })
  }

  return out
}
