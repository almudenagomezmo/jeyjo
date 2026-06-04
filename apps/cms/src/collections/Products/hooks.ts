import type { CollectionBeforeValidateHook } from 'payload'

import { slugifyProductTitle } from '@/utilities/slugifyProductTitle'

export const productSlugHooks: CollectionBeforeValidateHook[] = [
  async ({ data, operation, req, originalDoc }) => {
    if (!data) return data

    const title = (data.title as string | undefined) ?? (originalDoc?.title as string | undefined)
    const currentSlug = data.slug as string | undefined

    if ((!currentSlug || currentSlug.trim() === '') && title) {
      data.slug = slugifyProductTitle(title)
    }

    if (data.slug) {
      const existing = await req.payload.find({
        collection: 'products',
        where: {
          slug: { equals: data.slug },
          ...(operation === 'update' && originalDoc?.id
            ? { id: { not_equals: originalDoc.id } }
            : {}),
        },
        limit: 1,
        depth: 0,
      })

      if (existing.docs.length > 0) {
        throw new Error(`La URL amigable "${data.slug}" ya está en uso por otro producto.`)
      }
    }

    return data
  },
]
