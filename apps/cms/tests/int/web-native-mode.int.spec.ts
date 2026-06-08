import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi, afterEach } from 'vitest'

import { guardErpProductFields } from '@/erp/guardErpFields'
import { guardStockProductFields } from '@/stock/guardStockFields'
import { mapSystemSettingsToDto } from '@/lib/system-config/map-dto'
import { isWebNativeModeFromEnv } from '@/lib/web-native-mode'

describe('web-native mode', () => {
  const prev = process.env.WEB_NATIVE_MODE

  afterEach(() => {
    if (prev === undefined) delete process.env.WEB_NATIVE_MODE
    else process.env.WEB_NATIVE_MODE = prev
  })

  it('defaults webNativeMode to true in DTO', () => {
    const dto = mapSystemSettingsToDto({})
    expect(dto.webNativeMode).toBe(true)
  })

  it('maps webNativeMode false from CMS doc', () => {
    const dto = mapSystemSettingsToDto({ webNativeMode: false })
    expect(dto.webNativeMode).toBe(false)
  })

  it('allows commercial field edits when web-native req context', () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'true')
    const req = { context: {} } as PayloadRequest
    const data = guardErpProductFields({
      data: { p1Price: 99, skuErp: 'REF-NEW' },
      originalDoc: { p1Price: 10, skuErp: 'REF-OLD', syncErpAt: '2020-01-01' },
      req,
    })
    expect(data?.p1Price).toBe(99)
    expect(data?.skuErp).toBe('REF-NEW')
    expect(data?.syncErpAt).toBeUndefined()
  })

  it('blocks commercial edits when ERP mode', () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'false')
    const req = { context: {} } as PayloadRequest
    const data = guardErpProductFields({
      data: { p1Price: 99 },
      originalDoc: { p1Price: 10 },
      req,
    })
    expect(data?.p1Price).toBe(10)
  })

  it('allows erpStock edit and protects stockIndicator in web-native', () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'true')
    const req = { context: {} } as PayloadRequest
    const data = guardStockProductFields({
      data: { erpStock: 12, stockIndicator: 'available' },
      originalDoc: { erpStock: 5, stockIndicator: 'low' },
      req,
    })
    expect(data?.erpStock).toBe(12)
    expect(data?.stockIndicator).toBe('low')
  })

  it('env WEB_NATIVE_MODE=false disables web-native from env', () => {
    vi.stubEnv('WEB_NATIVE_MODE', 'false')
    expect(isWebNativeModeFromEnv()).toBe(false)
  })
})
