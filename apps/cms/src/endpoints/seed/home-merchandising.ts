import type { Payload, PayloadRequest } from 'payload'

export async function seedHomeMerchandising({
  payload,
  req,
  heroMediaId,
}: {
  payload: Payload
  req: PayloadRequest
  heroMediaId: string | number
}): Promise<void> {
  payload.logger.info('— Seeding home merchandising global (jeyjo.es)...')

  const categories = await payload.find({
    collection: 'categories',
    where: { slug: { in: ['escritura', 'papel', 'impresion', 'archivo', 'oficina', 'reciclaje'] } },
    limit: 6,
    depth: 0,
    sort: 'sortOrder',
  })

  const products = await payload.find({
    collection: 'products',
    where: {
      skuErp: {
        in: [
          '10102007',
          '12701009',
          'ERP-TNR-085',
          '16401136',
          '24404589',
          'ERP-PRT-M404',
          'REF-001',
          'REF-002',
          '11601380',
          '18701089',
        ],
      },
    },
    limit: 20,
    depth: 0,
  })

  const bySku = new Map(products.docs.map((p) => [p.skuErp, p.id]))

  const bicAzul = bySku.get('10102007')
  const navigator = bySku.get('12701009')
  const toner = bySku.get('ERP-TNR-085')
  const destructora = bySku.get('16401136')
  const silla = bySku.get('24404589')
  const printer = bySku.get('ERP-PRT-M404')
  const ref001 = bySku.get('REF-001')
  const ref002 = bySku.get('REF-002')
  const archivador = bySku.get('11601380')
  const papelHigienico = bySku.get('18701089')

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastMonth = new Date(now)
  lastMonth.setDate(lastMonth.getDate() - 30)

  const topSalesB2c = [bicAzul, navigator, archivador, papelHigienico].filter(
    (id): id is number => typeof id === 'number',
  )
  const topSalesB2b = [printer, toner, destructora, silla].filter(
    (id): id is number => typeof id === 'number',
  )
  const ecoHighlight = [ref002, papelHigienico].filter((id): id is number => typeof id === 'number')
  const heroImageId = typeof heroMediaId === 'number' ? heroMediaId : Number(heroMediaId)

  await payload.updateGlobal({
    slug: 'home',
    data: {
      promoBanners: [
        {
          image: heroImageId,
          href: '/c/escritura',
          alt: 'Escritura y corrección — BIC, Uni-Ball, Staedtler',
          segment: 'b2c',
          startAt: yesterday.toISOString(),
          endAt: tomorrow.toISOString(),
          sortOrder: 1,
        },
        {
          image: heroImageId,
          href: '/c/impresion',
          alt: 'Consumibles e impresión para empresas',
          segment: 'b2b',
          startAt: yesterday.toISOString(),
          endAt: tomorrow.toISOString(),
          sortOrder: 2,
        },
        {
          image: heroImageId,
          href: '/search?q=eco',
          alt: 'Campaña eco (expirada — QA)',
          segment: 'both',
          startAt: lastMonth.toISOString(),
          endAt: lastWeek.toISOString(),
          sortOrder: 0,
        },
        {
          image: heroImageId,
          href: '/c/reciclaje',
          alt: 'Portes gratis desde 39 € — toda España',
          segment: 'both',
          startAt: yesterday.toISOString(),
          endAt: tomorrow.toISOString(),
          sortOrder: 3,
        },
      ],
      featuredCategories: categories.docs.map((c) => c.id),
      topSalesB2c,
      topSalesB2b,
      ecoHighlight,
    },
    depth: 0,
    req,
    context: { disableRevalidate: true },
  })
}
