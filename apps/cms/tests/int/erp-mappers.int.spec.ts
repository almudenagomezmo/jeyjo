import { STUB_SAMPLE_PRODUCTS } from '@jeyjo/erp-ports'
import { describe, it, expect } from 'vitest'

import { ERP_PRODUCT_FIELD_NAMES } from '@/erp/erpFieldNames'
import { mapErpProductDtoToPayload } from '@/erp/mappers/product'
import { mapErpSupplierDtoToPayload } from '@/erp/mappers/supplier'

describe('ERP DTO mappers', () => {
  it('mapErpProductDtoToPayload keys align with erpFields', () => {
    const dto = STUB_SAMPLE_PRODUCTS[0]!
    const mapped = mapErpProductDtoToPayload(dto, '2026-06-04T12:00:00.000Z')
    for (const key of ERP_PRODUCT_FIELD_NAMES) {
      expect(key in mapped).toBe(true)
    }
    expect(mapped.skuErp).toBe(dto.skuErp)
    expect(mapped.syncErpAt).toBe('2026-06-04T12:00:00.000Z')
  })

  it('mapErpSupplierDtoToPayload includes erpCode', () => {
    const mapped = mapErpSupplierDtoToPayload({
      erpCode: 'DIST-01',
      name: 'Demo',
      type: 'distributor',
    })
    expect(mapped.erpCode).toBe('DIST-01')
    expect(mapped.name).toBe('Demo')
  })
})
