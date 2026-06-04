import type { ErpPricingReader } from '@jeyjo/erp-ports'
import { STUB_SPECIAL_PRICES } from '@jeyjo/erp-ports'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

export type ErpPricingSyncResult = {
  rowsUpserted: number
  errors: string[]
}

export class ErpPricingSyncService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly reader: ErpPricingReader,
  ) {}

  async syncAllFromReader(): Promise<ErpPricingSyncResult> {
    const result: ErpPricingSyncResult = { rowsUpserted: 0, errors: [] }

    let offerCursor: string | null = null
    do {
      const page = await this.reader.listGroupOffers({ limit: 100, cursor: offerCursor })
      for (const offer of page.items) {
        try {
          const upserted = await this.upsertGroupOffer(offer)
          if (upserted) result.rowsUpserted += 1
        } catch (e) {
          result.errors.push(`group_offer ${offer.skuErp}: ${formatError(e)}`)
        }
      }
      offerCursor = page.hasMore ? page.nextCursor : null
    } while (offerCursor)

    const customerCodes = [
      ...new Set(STUB_SPECIAL_PRICES.map((s) => s.customerErpCode)),
    ]
    const { data: customers } = await this.supabase
      .from('customers')
      .select('id, erp_code')
      .not('erp_code', 'is', null)

    const codesToSync = new Set(customerCodes)
    for (const row of customers ?? []) {
      if (row.erp_code) codesToSync.add(row.erp_code)
    }

    for (const erpCode of codesToSync) {
      const customerId = await this.resolveCustomerId(erpCode)
      if (!customerId) {
        result.errors.push(`special_prices: no customer for erp_code ${erpCode}`)
        continue
      }

      let priceCursor: string | null = null
      do {
        const page = await this.reader.listSpecialPrices(erpCode, {
          limit: 100,
          cursor: priceCursor,
        })
        for (const sp of page.items) {
          try {
            const upserted = await this.upsertSpecialPrice(customerId, sp)
            if (upserted) result.rowsUpserted += 1
          } catch (e) {
            result.errors.push(`special_price ${sp.skuErp}/${erpCode}: ${formatError(e)}`)
          }
        }
        priceCursor = page.hasMore ? page.nextCursor : null
      } while (priceCursor)
    }

    return result
  }

  private async resolveCustomerId(erpCode: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('id')
      .eq('erp_code', erpCode)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data?.id ?? null
  }

  private async upsertSpecialPrice(
    customerId: string,
    sp: { skuErp: string; netPrice: number; validFrom: string; validTo?: string | null },
  ): Promise<boolean> {
    const { error } = await this.supabase.from('special_prices').upsert(
      {
        customer_id: customerId,
        product_sku: sp.skuErp,
        net_price: sp.netPrice,
        valid_from: sp.validFrom,
        valid_to: sp.validTo ?? null,
      },
      { onConflict: 'customer_id,product_sku' },
    )
    if (error) throw new Error(error.message)
    return true
  }

  private async upsertGroupOffer(offer: {
    skuErp: string
    offerNetPrice: number
    validFrom: string
    validTo?: string | null
    active: boolean
    customerGroup?: number | null
  }): Promise<boolean> {
    const { data: existing, error: findError } = await this.supabase
      .from('group_offers')
      .select('id')
      .eq('sku_erp', offer.skuErp)
      .eq('active', true)
      .maybeSingle()

    if (findError) throw new Error(findError.message)

    const row = {
      sku_erp: offer.skuErp,
      offer_net_price: offer.offerNetPrice,
      valid_from: offer.validFrom,
      valid_to: offer.validTo ?? null,
      active: offer.active,
      customer_group: offer.customerGroup ?? null,
    }

    if (existing?.id) {
      const { error } = await this.supabase
        .from('group_offers')
        .update(row)
        .eq('id', existing.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await this.supabase.from('group_offers').insert(row)
      if (error) throw new Error(error.message)
    }
    return true
  }
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
