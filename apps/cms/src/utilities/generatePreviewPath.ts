import { PreviewSearchParams } from '@/app/(app)/next/preview/route'
import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  products: '/p/',
}

function storefrontBase(): string | null {
  const base =
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() || process.env.STOREFRONT_URL?.trim() || ''
  return base ? base.replace(/\/$/, '') : null
}

type Props = {
  collection: Extract<CollectionSlug, keyof typeof collectionPrefixMap>
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  if (slug === undefined || slug === null) {
    return null
  }

  const encodedSlug = encodeURIComponent(slug)
  const prefix = collectionPrefixMap[collection]
  if (!prefix) return null

  const relativePath = `${prefix}${encodedSlug}`
  const storefront = storefrontBase()
  const path = storefront ? `${storefront}${relativePath}` : relativePath

  const encodedParams = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  } satisfies PreviewSearchParams)

  return `/next/preview?${encodedParams.toString()}`
}
