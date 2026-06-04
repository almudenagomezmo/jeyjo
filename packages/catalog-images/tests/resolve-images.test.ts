import { describe, expect, it } from 'vitest'

import { resolveCatalogImage, resolveSeoImage } from '../src/index.js'

describe('resolveCatalogImage', () => {
  it('prefers own image over provider URL', () => {
    expect(
      resolveCatalogImage({
        ownImage: { url: 'https://cdn.jeyjo.local/own.jpg' },
        providerImageUrl: 'https://provider.example/p.jpg',
      }),
    ).toBe('https://cdn.jeyjo.local/own.jpg')
  })

  it('falls back to provider URL when own is empty', () => {
    expect(
      resolveCatalogImage({
        ownImage: null,
        providerImageUrl: '  https://provider.example/p.jpg  ',
      }),
    ).toBe('https://provider.example/p.jpg')
  })

  it('returns null when all inputs are empty', () => {
    expect(resolveCatalogImage({})).toBeNull()
    expect(
      resolveCatalogImage({ ownImage: { url: '  ' }, providerImageUrl: '  ' }),
    ).toBeNull()
  })
})

describe('resolveSeoImage', () => {
  it('prefers meta image over catalog', () => {
    expect(
      resolveSeoImage({
        metaImage: { url: '/media/seo.jpg' },
        ownImage: { url: 'https://cdn.jeyjo.local/own.jpg' },
        providerImageUrl: 'https://provider.example/p.jpg',
      }),
    ).toBe('/media/seo.jpg')
  })

  it('falls back to catalog image when meta is empty', () => {
    expect(
      resolveSeoImage({
        metaImage: null,
        ownImage: null,
        providerImageUrl: 'https://provider.example/p.jpg',
      }),
    ).toBe('https://provider.example/p.jpg')
  })

  it('returns null when all inputs are empty', () => {
    expect(resolveSeoImage({})).toBeNull()
  })
})
