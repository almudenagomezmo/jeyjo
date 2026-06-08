import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi } from 'vitest'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { guardErpProductFields } from '@/erp/guardErpFields'
import { STUB_SAMPLE_PRODUCTS } from '@jeyjo/erp-ports'

describe('ERP field guard (beforeChange)', () => {
  it('reverts p1Price when erpSync is not set', () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'false')
    const req = { context: {} } as PayloadRequest
    const data = guardErpProductFields({
      data: { p1Price: 9999.99, title: 'Test' },
      originalDoc: { p1Price: 45.9, title: 'Test' },
      req,
    })
    expect(data?.p1Price).toBe(45.9)
  })

  it('allows p1Price change when erpSync is true', () => {
    const req = { context: { erpSync: true } } as PayloadRequest
    const data = guardErpProductFields({
      data: { p1Price: 88.88 },
      originalDoc: { p1Price: 45.9 },
      req,
    })
    expect(data?.p1Price).toBe(88.88)
  })
})

describe('ErpCatalogSyncService', () => {
  it('updates product via Payload API with erpSync context on req', async () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'false')
    const dto = { ...STUB_SAMPLE_PRODUCTS[0]!, p1Price: 88.88, p2Price: 77.77 }
    const syncReq = { context: { erpSync: true } } as PayloadRequest

    const update = vi.fn().mockResolvedValue({ id: 1 })
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: 1, skuErp: dto.skuErp }],
    })
    const findByID = vi.fn()

    const payload = {
      find,
      update,
      findByID,
    } as unknown as Payload

    const reader = {
      listProducts: vi.fn(),
      getProductBySku: vi.fn(),
      listSuppliers: vi.fn(),
    }

    const service = new ErpCatalogSyncService(payload, reader)
    await service.applyProduct(dto, syncReq)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        overrideAccess: true,
        req: syncReq,
        data: expect.objectContaining({
          p1Price: 88.88,
          p2Price: 77.77,
          syncErpAt: expect.any(String),
        }),
      }),
    )
    expect(syncReq.context?.erpSync).toBe(true)
  })

  it('creates draft product when SKU is missing', async () => {
    const dto = {
      skuErp: 'NEW-SKU-999',
      shortDescription: 'Nuevo artículo desde ERP',
      p1Price: 5,
      p2Price: 4,
      vatRate: 21,
      isWildcard: false,
    }
    const syncReq = { context: { erpSync: true } } as PayloadRequest

    const create = vi.fn().mockResolvedValue({ id: 99 })
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const payload = { find, create, update: vi.fn() } as unknown as Payload
    const reader = {
      listProducts: vi.fn(),
      getProductBySku: vi.fn(),
      listSuppliers: vi.fn(),
    }

    const service = new ErpCatalogSyncService(payload, reader)
    const applied = await service.applyProduct(dto, syncReq)

    expect(applied).toBe(true)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        data: expect.objectContaining({
          skuErp: 'NEW-SKU-999',
          _status: 'draft',
          title: 'Nuevo artículo desde ERP',
        }),
        req: syncReq,
      }),
    )
  })
})
