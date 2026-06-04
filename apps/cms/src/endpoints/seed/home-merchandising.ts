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
  payload.logger.info('— Seeding home merchandising global...')

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
        in: ['REF-001', 'REF-002', 'ERP-TNR-085', 'ERP-GRF-001', 'ERP-PVC-032', 'ERP-PRT-M404'],
      },
    },
    limit: 20,
    depth: 0,
  })

  const bySku = new Map(products.docs.map((p) => [p.skuErp, p.id]))

  const ref001 = bySku.get('REF-001')
  const ref002 = bySku.get('REF-002')
  const toner = bySku.get('ERP-TNR-085')
  const grifo = bySku.get('ERP-GRF-001')
  const pvc = bySku.get('ERP-PVC-032')
  const printer = bySku.get('ERP-PRT-M404')

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastMonth = new Date(now)
  lastMonth.setDate(lastMonth.getDate() - 30)

  const topSalesB2c = [ref001, ref002, toner, grifo].filter((id): id is number => typeof id === 'number')
  const topSalesB2b = [printer, toner, ref002].filter((id): id is number => typeof id === 'number')
  const ecoHighlight = [pvc, ref002].filter((id): id is number => typeof id === 'number')
  const heroImageId = typeof heroMediaId === 'number' ? heroMediaId : Number(heroMediaId)

  await payload.updateGlobal({
    slug: 'home',
    data: {
      promoBanners: [
        {
          image: heroImageId,
          href: '/c/escritura',
          alt: 'Ofertas escritura B2C',
          segment: 'b2c',
          startAt: yesterday.toISOString(),
          endAt: tomorrow.toISOString(),
          sortOrder: 1,
        },
        {
          image: heroImageId,
          href: '/c/impresion',
          alt: 'Portal empresas impresión',
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
          alt: 'Sostenibilidad para todos',
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
