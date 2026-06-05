import { describe, expect, it } from 'vitest'

import { resolveCatalogImage, resolvePdpGalleryUrls, resolveSeoImage } from '../src/index.js'

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

describe('resolvePdpGalleryUrls', () => {
  it('returns primary plus additional images in order', () => {
    expect(
      resolvePdpGalleryUrls({
        ownImage: { url: 'https://cdn.jeyjo.local/own.jpg' },
        providerImageUrl: 'https://provider.example/p.jpg',
        additionalImages: [
          { image: { url: 'https://cdn.jeyjo.local/extra-1.jpg' } },
          { image: { url: 'https://cdn.jeyjo.local/extra-2.jpg' } },
        ],
      }),
    ).toEqual([
      'https://cdn.jeyjo.local/own.jpg',
      'https://cdn.jeyjo.local/extra-1.jpg',
      'https://cdn.jeyjo.local/extra-2.jpg',
    ])
  })

  it('uses provider URL as primary when own image is missing', () => {
    expect(
      resolvePdpGalleryUrls({
        ownImage: null,
        providerImageUrl: 'https://provider.example/p.jpg',
        additionalImages: [{ image: { url: 'https://cdn.jeyjo.local/extra.jpg' } }],
      }),
    ).toEqual(['https://provider.example/p.jpg', 'https://cdn.jeyjo.local/extra.jpg'])
  })

  it('deduplicates when additional image matches primary', () => {
    expect(
      resolvePdpGalleryUrls({
        ownImage: { url: 'https://cdn.jeyjo.local/own.jpg' },
        additionalImages: [{ image: { url: 'https://cdn.jeyjo.local/own.jpg' } }],
      }),
    ).toEqual(['https://cdn.jeyjo.local/own.jpg'])
  })

  it('returns only additional images when catalog image is missing', () => {
    expect(
      resolvePdpGalleryUrls({
        additionalImages: [{ image: { url: 'https://cdn.jeyjo.local/extra.jpg' } }],
      }),
    ).toEqual(['https://cdn.jeyjo.local/extra.jpg'])
  })

  it('returns empty array when no images exist', () => {
    expect(resolvePdpGalleryUrls({})).toEqual([])
  })
})
