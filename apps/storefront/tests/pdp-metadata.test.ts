import { describe, expect, it } from 'vitest'

import {
  buildPdpDescription,
  buildPdpMetadata,
  buildPdpMetadataFromView,
  buildPdpSeoImageUrl,
  buildProductJsonLd,
  buildProductJsonLdFromView,
} from '@/lib/seo/pdp-metadata'

describe('pdp metadata helpers', () => {
  it('prefers meta description over long text', () => {
    expect(
      buildPdpDescription({
        title: 'T',
        metaDescription: 'Meta corta',
        longDescriptionPlain: 'Texto largo del producto',
      }),
    ).toBe('Meta corta')
  })

  it('resolves SEO image with meta over catalog', () => {
    expect(
      buildPdpSeoImageUrl({
        title: 'T',
        metaImage: { url: '/media/og.jpg' },
        ownImage: { url: '/media/own.jpg' },
        providerImageUrl: 'https://provider.example/p.jpg',
      }),
    ).toBe('/media/og.jpg')
  })

  it('builds openGraph and twitter when image is set', () => {
    const meta = buildPdpMetadata({
      title: 'Grifo',
      metaImage: { url: 'https://cdn.example/og.jpg' },
      ownImage: null,
      providerImageUrl: null,
    })
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example/og.jpg' }])
    expect(meta.twitter?.images).toEqual(['https://cdn.example/og.jpg'])
  })

  it('builds Product JSON-LD with sku and image', () => {
    const ld = buildProductJsonLd({
      sku: 'REF-1',
      title: 'Grifo',
      metaDescription: 'Descripción',
      metaImage: { url: 'https://cdn.example/og.jpg' },
      ownImage: null,
      providerImageUrl: null,
    })
    expect(ld).toMatchObject({
      '@type': 'Product',
      sku: 'REF-1',
      name: 'Grifo',
      image: ['https://cdn.example/og.jpg'],
    })
  })

  it('buildPdpMetadataFromView uses pre-resolved seo image', () => {
    const meta = buildPdpMetadataFromView({
      sku: 'REF-1',
      title: 'Grifo',
      metaTitle: 'Grifo | Jeyjo',
      metaDescription: 'Desc',
      longDescriptionHtml: null,
      seoImageUrl: 'https://cdn.example/resolved.jpg',
    })
    expect(meta.title).toBe('Grifo | Jeyjo')
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example/resolved.jpg' }])
  })

  it('buildProductJsonLdFromView uses galleryUrls when multiple images exist', () => {
    const ld = buildProductJsonLdFromView({
      sku: 'REF-1',
      title: 'Grifo',
      metaTitle: null,
      metaDescription: null,
      longDescriptionHtml: null,
      seoImageUrl: 'https://cdn.example/og.jpg',
      galleryUrls: [
        'https://cdn.example/1.jpg',
        'https://cdn.example/2.jpg',
        'https://cdn.example/3.jpg',
      ],
    })
    expect(ld.image).toEqual([
      'https://cdn.example/1.jpg',
      'https://cdn.example/2.jpg',
      'https://cdn.example/3.jpg',
    ])
  })
})
