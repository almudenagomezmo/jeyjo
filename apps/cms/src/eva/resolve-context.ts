import { createStubPurchaseHistoryReader } from '@jeyjo/erp-ports'
import type { Payload } from 'payload'

import type { EvaContextClaims, EvaContextPayload } from '@/eva/types'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const SHIPPING_POLICY =
  'Envío en 24-48 h laborables en península. Consulta condiciones en jeyjo.es.'

async function loadCustomerMeta(customerId: string): Promise<{
  commercialName: string
  erpCode: string | null
} | null> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('customers')
    .select('commercial_name, erp_code')
    .eq('id', customerId)
    .maybeSingle()

  if (!data) return null
  return {
    commercialName: data.commercial_name?.trim() || 'Cliente',
    erpCode: data.erp_code?.trim() ?? null,
  }
}

async function loadRecentOrders(payload: Payload, customerId: string) {
  const found = await payload.find({
    collection: 'orders',
    where: { customerRef: { equals: customerId } },
    sort: '-createdAt',
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })

  return found.docs.map((order) => ({
    orderNumber: (order.orderNumber as string | null) ?? null,
    createdAt: (order.createdAt as string) ?? new Date().toISOString(),
    total: typeof order.amount === 'number' ? order.amount : null,
    status: (order.jeyjoStatus as string | null) ?? null,
  }))
}

async function loadPurchaseHistory(erpCode: string | null) {
  if (!erpCode) return []
  const reader = createStubPurchaseHistoryReader()
  const rows = await reader.listLines(erpCode, { limit: 10 })
  return rows.map((row) => ({
    sku: row.sku,
    quantity: row.quantity,
    purchasedAt: row.purchasedAt,
  }))
}

async function loadPublicProduct(payload: Payload, sku: string | undefined) {
  if (!sku?.trim()) return null
  const found = await payload.find({
    collection: 'products',
    where: { skuErp: { equals: sku.trim() } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = found.docs[0]
  if (!doc) return null
  return {
    sku: sku.trim(),
    name: String(doc.title ?? sku),
    publicPrice: null,
  }
}

export async function resolveEvaContext(
  payload: Payload,
  claims: EvaContextClaims,
): Promise<EvaContextPayload> {
  if (claims.sub === 'anonymous') {
    const product = await loadPublicProduct(payload, claims.page.productSku)
    return {
      kind: 'anonymous',
      page: claims.page,
      shippingPolicy: SHIPPING_POLICY,
      product,
    }
  }

  const customerId = claims.sub
  const meta = await loadCustomerMeta(customerId)
  if (!meta) {
    return {
      kind: 'anonymous',
      page: claims.page,
      shippingPolicy: SHIPPING_POLICY,
      product: await loadPublicProduct(payload, claims.page.productSku),
    }
  }

  const [recentOrders, purchaseHistory] = await Promise.all([
    loadRecentOrders(payload, customerId),
    loadPurchaseHistory(meta.erpCode),
  ])

  return {
    kind: 'authenticated',
    customerId,
    commercialName: meta.commercialName,
    page: claims.page,
    recentOrders,
    purchaseHistory,
  }
}
