import { afterEach, describe, expect, it, vi } from 'vitest'

import * as customerContext from '@/lib/auth/customer-context'
import * as fetchPdp from '@/lib/catalog/fetch-product-pdp'
import * as pricingBatch from '@/lib/pricing/resolve-batch'
import * as reviewsPayload from '@/lib/reviews/payload-product-reviews'
import * as purchasedSku from '@/lib/reviews/assert-customer-purchased-sku'
import * as stockModule from '@/lib/stock/get-stock-indicator'

const { loadPdpPage } = await import('@/lib/pdp/load-pdp-page')

describe('loadPdpPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('prefetches quote and batch pricing for related SKUs with one CMS fetch', async () => {
    const fetchSpy = vi.spyOn(fetchPdp, 'fetchPublicProductPdpBySlug').mockResolvedValue({
      matchedBySku: false,
      doc: {
        id: 161,
        skuErp: 'ERP-PRT-M404',
        slug: 'impresora-laser-hp-pro-m404',
        title: 'Impresora láser HP Pro M404',
        _status: 'published',
        isWildcard: false,
        brand: { name: 'Demo' },
        supplier: { name: 'Distrisantiago' },
        categories: [{ slug: 'escritura', name: 'Escritura' }],
        packUnit: 1,
        vatRate: 21,
        relatedProducts: [
          {
            id: 160,
            skuErp: 'ERP-TNR-085',
            slug: 'toner-negro-hp-85a',
            title: 'Tóner',
            brand: { name: 'Demo' },
        supplier: { name: 'Distrisantiago' },
          },
        ],
      },
    })

    vi.spyOn(fetchPdp, 'resolveRelatedProductRows').mockResolvedValue([
      {
        sku: 'ERP-TNR-085',
        slug: 'toner-negro-hp-85a',
        title: 'Tóner',
        brand: 'Demo',
        supplier: 'Distrisantiago',
        facetColor: null,
        facetMaterial: null,
        ecoLabel: false,
        categorySlugs: [],
        packUnit: 1,
        vatRate: 21,
        stockIndicator: 'available',
        allowOrderWithoutStock: false,
        rating: 4.5,
        reviews: 0,
        hasOffer: false,
        imageUrl: null,
      },
    ])

    vi.spyOn(pricingBatch, 'resolvePriceQuotesBatch').mockResolvedValue({
      'ERP-PRT-M404': {
        sku: 'ERP-PRT-M404',
        netUnit: 189,
        grossUnit: 228.69,
        vatRate: 21,
        appliedRule: 'p1_retail',
      },
      'ERP-TNR-085': {
        sku: 'ERP-TNR-085',
        netUnit: 42.5,
        grossUnit: 51.43,
        vatRate: 21,
        appliedRule: 'p1_retail',
      },
    })

    vi.spyOn(stockModule, 'getStockIndicator').mockResolvedValue({
      level: 'available',
      label: 'Disponible',
      isStale: false,
      allowOrderWithoutStock: false,
    })

    const primaryQuote = {
      sku: 'ERP-PRT-M404',
      netUnit: 189,
      grossUnit: 228.69,
      vatRate: 21,
      appliedRule: 'p1_retail' as const,
    }

    vi.spyOn(await import('@jeyjo/pricing'), 'resolvePrice').mockResolvedValue(primaryQuote)
    vi.spyOn(
      await import('@/lib/pricing/product-catalog'),
      'getProductPriceBase',
    ).mockResolvedValue({
      sku: 'ERP-PRT-M404',
      p1Price: 189,
      p2Price: 175,
      vatRate: 21,
    })

    vi.spyOn(customerContext, 'getCustomerContext').mockResolvedValue(null)
    vi.spyOn(reviewsPayload, 'listApprovedProductReviews').mockResolvedValue({
      docs: [],
      total: 0,
      page: 1,
      pageSize: 10,
    })
    vi.spyOn(reviewsPayload, 'fetchCustomerProductReview').mockResolvedValue(null)
    vi.spyOn(purchasedSku, 'assertCustomerPurchasedSku').mockResolvedValue(false)

    const result = await loadPdpPage('impresora-laser-hp-pro-m404')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result?.relatedRows).toHaveLength(1)
    expect(result?.quotesBySku['ERP-TNR-085']?.netUnit).toBe(42.5)
  })
})
