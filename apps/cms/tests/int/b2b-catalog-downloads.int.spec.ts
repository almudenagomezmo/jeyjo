import { describe, expect, it } from 'vitest'

import { canReadCollection, canWriteCollection } from '@/access/staffRoles'
import { assertPdfUploadSize } from '@/collections/B2bCatalogDownloads'

describe('b2b-catalog-downloads staff access', () => {
  const marketingUser = { staffRoles: ['marketing'] } as unknown as import('@/payload-types').User
  const catalogUser = { staffRoles: ['catalogo'] } as unknown as import('@/payload-types').User
  const personalizationUser = {
    staffRoles: ['personalizacion'],
  } as unknown as import('@/payload-types').User

  it('marketing can read and write', () => {
    expect(canReadCollection(marketingUser, 'b2b-catalog-downloads')).toBe(true)
    expect(canWriteCollection(marketingUser, 'b2b-catalog-downloads', 'create')).toBe(true)
  })

  it('personalizacion can read and write', () => {
    expect(canReadCollection(personalizationUser, 'b2b-catalog-downloads')).toBe(true)
    expect(canWriteCollection(personalizationUser, 'b2b-catalog-downloads', 'update')).toBe(true)
  })

  it('catalogo-only staff denied', () => {
    expect(canReadCollection(catalogUser, 'b2b-catalog-downloads')).toBe(false)
    expect(canWriteCollection(catalogUser, 'b2b-catalog-downloads', 'create')).toBe(false)
  })
})

describe('b2b-catalog-downloads PDF constraints', () => {
  it('rejects uploads over 25 MB', () => {
    expect(() => assertPdfUploadSize(26 * 1024 * 1024)).toThrow(/25 MB/)
  })

  it('allows uploads within limit', () => {
    expect(() => assertPdfUploadSize(1024)).not.toThrow()
  })
})
