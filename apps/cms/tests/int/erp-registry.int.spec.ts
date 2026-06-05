import { ErpIntegrationError } from '@jeyjo/erp-ports'
import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  getErpAdapters,
  resetErpAdapterCache,
  resolveErpAdapterKind,
  setInMemoryExcelCatalogForTests,
} from '@/erp/registry'

describe('ERP adapter registry', () => {
  afterEach(() => {
    resetErpAdapterCache()
    vi.unstubAllEnvs()
  })

  it('defaults to stub in development when ERP_ADAPTER is unset', () => {
    vi.stubEnv('ERP_ADAPTER', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(resolveErpAdapterKind()).toBe('stub')
    const bundle = getErpAdapters()
    expect(bundle.kind).toBe('stub')
    expect(bundle.catalogReader).toBeDefined()
    expect(bundle.catalogWriter).toBeDefined()
    expect(bundle.pricingReader).toBeDefined()
  })

  it('throws for unknown ERP_ADAPTER', () => {
    vi.stubEnv('ERP_ADAPTER', 'sap')
    vi.stubEnv('NODE_ENV', 'development')
    expect(() => resolveErpAdapterKind()).toThrow(/Unsupported ERP_ADAPTER/)
  })

  it('resolves excel adapter when preloaded in memory', () => {
    vi.stubEnv('ERP_ADAPTER', 'excel')
    vi.stubEnv('NODE_ENV', 'development')
    resetErpAdapterCache()

    setInMemoryExcelCatalogForTests({
      products: [
        {
          skuErp: 'REF-001',
          p1Price: 10,
          p2Price: 8,
          vatRate: 21,
        },
      ],
      suppliers: [],
    })

    const bundle = getErpAdapters()
    expect(bundle.kind).toBe('excel')
    expect(bundle.catalogReader).toBeDefined()
  })

  it('throws ERP_UNAVAILABLE for excel without preload', () => {
    vi.stubEnv('ERP_ADAPTER', 'excel')
    vi.stubEnv('NODE_ENV', 'development')
    resetErpAdapterCache()
    expect(() => getErpAdapters()).toThrow(ErpIntegrationError)
    try {
      getErpAdapters()
    } catch (e) {
      expect((e as ErpIntegrationError).code).toBe('ERP_UNAVAILABLE')
    }
  })
})
