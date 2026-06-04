import type { Metadata } from 'next'
import { resolveSeoImage } from '@jeyjo/catalog-images'

import { absoluteMediaUrlOrNull } from '@/lib/catalog/absolute-media-url'

export type PdpSeoSource = {
  title: string
  metaTitle?: string | null
  metaDescription?: string | null
  longDescriptionPlain?: string | null
  ownImage?: { url?: string | null } | string | number | null
  providerImageUrl?: string | null
  metaImage?: { url?: string | null } | string | number | null
}

export function buildPdpDescription(source: PdpSeoSource): string | undefined {
  const meta = source.metaDescription?.trim()
  if (meta) return meta.slice(0, 160)
  const plain = source.longDescriptionPlain?.replace(/\s+/g, ' ').trim()
  if (plain) return plain.slice(0, 160)
  return undefined
}

export function buildPdpSeoImageUrl(source: PdpSeoSource): string | null {
  const raw = resolveSeoImage({
    metaImage: source.metaImage,
    ownImage: source.ownImage,
    providerImageUrl: source.providerImageUrl,
  })
  return absoluteMediaUrlOrNull(raw)
}

export function buildPdpMetadata(source: PdpSeoSource): Metadata {
  const title = source.metaTitle?.trim() || source.title
  const description = buildPdpDescription(source)
  const imageUrl = buildPdpSeoImageUrl(source)

  const openGraphImages = imageUrl ? [{ url: imageUrl }] : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: openGraphImages,
      type: 'website',
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export type PdpViewSeoFields = {
  sku: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  longDescriptionHtml: string | null
  seoImageUrl: string | null
}

export function buildPdpMetadataFromView(product: PdpViewSeoFields): Metadata {
  return buildPdpMetadata({
    title: product.title,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    longDescriptionPlain: product.longDescriptionHtml?.replace(/<[^>]+>/g, '') ?? null,
    metaImage: product.seoImageUrl ? { url: product.seoImageUrl } : null,
    ownImage: null,
    providerImageUrl: null,
  })
}

export function buildProductJsonLdFromView(product: PdpViewSeoFields): Record<string, unknown> {
  return buildProductJsonLd({
    sku: product.sku,
    title: product.title,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    longDescriptionPlain: product.longDescriptionHtml?.replace(/<[^>]+>/g, '') ?? null,
    metaImage: product.seoImageUrl ? { url: product.seoImageUrl } : null,
    ownImage: null,
    providerImageUrl: null,
  })
}

export function buildProductJsonLd(source: PdpSeoSource & { sku: string }): Record<string, unknown> {
  const imageUrl = buildPdpSeoImageUrl(source)
  const description = buildPdpDescription(source)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: source.title,
    sku: source.sku,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
  }
}
