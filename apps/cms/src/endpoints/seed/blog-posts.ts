import type { Payload, PayloadRequest } from 'payload'

function placeholderLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: 'Introducción', version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

async function ensureCategory(
  payload: Payload,
  req: PayloadRequest,
  name: string,
  slug: string,
): Promise<number> {
  const existing = await payload.find({
    collection: 'blog-categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.docs[0]) {
    return existing.docs[0].id as number
  }

  const created = await payload.create({
    collection: 'blog-categories',
    data: { name, slug },
    req,
    context: { seedBlogPosts: true },
  })

  return created.id as number
}

async function ensurePost(
  payload: Payload,
  req: PayloadRequest,
  data: {
    title: string
    slug: string
    categoryId: number
    featuredImageId: number
    published: boolean
    publishedAt?: string
    tags?: string[]
    excerpt?: string
  },
): Promise<void> {
  const existing = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: data.slug } },
    limit: 1,
    depth: 0,
    req,
  })

  const body = {
    title: data.title,
    slug: data.slug,
    category: data.categoryId,
    featuredImage: data.featuredImageId,
    authorName: 'Equipo Jeyjo',
    metaDescription: `${data.title} — Blog Jeyjo Material de Oficina`,
    excerpt: data.excerpt,
    content: placeholderLexical(
      `${data.title}: contenido de demostración para validar el blog integrado en Payload y el storefront.`,
    ),
    tags: (data.tags ?? []).map((tag) => ({ tag })),
    published: data.published,
    publishedAt: data.publishedAt,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'blog-posts',
      id: existing.docs[0].id,
      data: body as Record<string, unknown>,
      req,
      context: { seedBlogPosts: true },
    })
    return
  }

  await payload.create({
    collection: 'blog-posts',
    data: body as Record<string, unknown>,
    req,
    context: { seedBlogPosts: true },
  })
}

export async function seedBlogPosts({
  payload,
  req,
  heroMediaId,
}: {
  payload: Payload
  req: PayloadRequest
  heroMediaId?: number | string
}): Promise<void> {
  let featuredImageId = heroMediaId

  if (!featuredImageId) {
    const media = await payload.find({
      collection: 'media',
      limit: 1,
      depth: 0,
      req,
    })
    featuredImageId = media.docs[0]?.id
  }

  if (!featuredImageId) {
    payload.logger.warn('[seed:blog-posts] No media available — skipping blog seed')
    return
  }

  const officeId = await ensureCategory(payload, req, 'Material de oficina', 'material-de-oficina')
  const b2bId = await ensureCategory(payload, req, 'Consejos B2B', 'consejos-b2b')

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  await ensurePost(payload, req, {
    title: 'Cómo organizar tu despacho con poco presupuesto',
    slug: 'organizar-despacho-poco-presupuesto',
    categoryId: officeId,
    featuredImageId: featuredImageId as number,
    published: true,
    publishedAt: yesterday.toISOString(),
    tags: ['oficina', 'organizacion'],
    excerpt: 'Ideas prácticas para equipar tu espacio de trabajo sin disparar el coste.',
  })

  await ensurePost(payload, req, {
    title: 'Borrador — artículo en revisión',
    slug: 'borrador-articulo-revision',
    categoryId: b2bId,
    featuredImageId: featuredImageId as number,
    published: false,
  })

  await ensurePost(payload, req, {
    title: 'Pedidos recurrentes B2B: guía rápida',
    slug: 'pedidos-recurrentes-b2b-guia',
    categoryId: b2bId,
    featuredImageId: featuredImageId as number,
    published: true,
    publishedAt: nextWeek.toISOString(),
    tags: ['b2b'],
  })

  payload.logger.info('— Seeded blog categories and posts (published, draft, scheduled)')
}
