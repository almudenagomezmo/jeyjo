import { describe, expect, it } from 'vitest'

import { mapCatalogDownloadDoc } from '@/lib/intranet/catalog-downloads/map-document'
import {
  isCatalogDownloadActive,
  matchesCustomerGroup,
  todayInMadrid,
} from '@/lib/intranet/catalog-downloads/validity'

describe('catalog downloads validity', () => {
  it('todayInMadrid returns YYYY-MM-DD', () => {
    expect(todayInMadrid()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('is active on validFrom and validUntil inclusive', () => {
    const today = '2026-06-05'
    expect(isCatalogDownloadActive('2026-06-05', '2026-12-31', today)).toBe(true)
    expect(isCatalogDownloadActive('2026-01-01', '2026-06-05', today)).toBe(true)
    expect(isCatalogDownloadActive('2026-06-06', '2026-12-31', today)).toBe(false)
    expect(isCatalogDownloadActive('2026-01-01', '2026-06-04', today)).toBe(false)
  })

  it('empty customerGroups matches all B2B groups', () => {
    expect(matchesCustomerGroup(undefined, 2)).toBe(true)
    expect(matchesCustomerGroup([], 4)).toBe(true)
  })

  it('customerGroups filter restricts visibility', () => {
    expect(matchesCustomerGroup(['3'], 3)).toBe(true)
    expect(matchesCustomerGroup(['3'], 2)).toBe(false)
  })
})

describe('catalog downloads map document', () => {
  it('maps payload doc to DTO with absolute download URL', () => {
    const dto = mapCatalogDownloadDoc({
      id: 1,
      title: 'Catálogo General 2026',
      description: 'Fixture',
      documentType: 'catalog',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      file: { url: '/media/catalogo.pdf' },
      coverImage: null,
    })
    expect(dto?.title).toBe('Catálogo General 2026')
    expect(dto?.downloadUrl).toContain('catalogo.pdf')
  })

  it('returns null when required fields missing', () => {
    expect(mapCatalogDownloadDoc({ id: 1, title: 'X' })).toBeNull()
  })
})
