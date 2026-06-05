import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { createPayloadRmaIncident, listPayloadRmaIncidents } from '@/lib/intranet/rma/payload-rma'
import type {
  CreateRmaInput,
  CreateRmaResult,
  RmaListFilter,
  RmaListResult,
} from '@/lib/intranet/rma/types'
import { validateCreateRmaInput } from '@/lib/intranet/rma/validate'

export async function buildRmaListPage(
  customerId: string,
  options: { status?: RmaListFilter; page?: number; pageSize?: number },
): Promise<RmaListResult> {
  const result = await listPayloadRmaIncidents(customerId, options)
  if (result.incidents.length === 0) return result

  const skus = [...new Set(result.incidents.map((i) => i.articleSku))]
  const products = await fetchPublicProductsBySkus(skus)
  const titleBySku = new Map(
    products.map((p) => [(p.skuErp ?? '').trim().toUpperCase(), p.title ?? null]),
  )

  return {
    ...result,
    incidents: result.incidents.map((row) => ({
      ...row,
      productTitle: titleBySku.get(row.articleSku.toUpperCase()) ?? null,
    })),
  }
}

export async function submitRmaRequest(
  customerId: string,
  customerEmail: string | null,
  input: CreateRmaInput,
): Promise<{
  result?: CreateRmaResult
  error?: { field: string; message: string; code?: 'DUPLICATE' }
}> {
  const validation = validateCreateRmaInput(input)
  if (validation) {
    return { error: validation }
  }

  try {
    const result = await createPayloadRmaIncident(customerId, customerEmail, input)
    return { result }
  } catch (err) {
    if (err instanceof Error && err.message === 'DUPLICATE_RMA') {
      return {
        error: {
          field: 'articleSku',
          code: 'DUPLICATE',
          message:
            'Ya existe una solicitud reciente para esta referencia y albarán. Espera 24 h o contacta con comercial.',
        },
      }
    }
    throw err
  }
}
