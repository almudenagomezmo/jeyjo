import { ErpIntegrationError } from '@jeyjo/erp-ports'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { getErpAdapters, resetErpAdapterCache, resolveErpAdapterKind } from '@/erp/registry'

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
  })

  it('throws for unknown ERP_ADAPTER', () => {
    vi.stubEnv('ERP_ADAPTER', 'sap')
    vi.stubEnv('NODE_ENV', 'development')
    expect(() => resolveErpAdapterKind()).toThrow(/Unsupported ERP_ADAPTER/)
  })

  it('throws ERP_NOT_IMPLEMENTED for excel before change #29', () => {
    vi.stubEnv('ERP_ADAPTER', 'excel')
    vi.stubEnv('NODE_ENV', 'development')
    resetErpAdapterCache()
    expect(() => getErpAdapters()).toThrow(ErpIntegrationError)
    try {
      getErpAdapters()
    } catch (e) {
      expect((e as ErpIntegrationError).code).toBe('ERP_NOT_IMPLEMENTED')
    }
  })
})
