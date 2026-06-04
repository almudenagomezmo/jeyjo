import type { Payload, PayloadRequest } from 'payload'

type RefFixture = {
  skuErp: string
  title: string
  slug: string
  shortDescription: string
  p1Price: number
  p2Price: number
  vatRate: number
  erpStock: number
}

const REF_FIXTURES: RefFixture[] = [
  {
    skuErp: 'REF-001',
    title: 'Fixture CA-PRECIOS-001',
    slug: 'ref-001',
    shortDescription: 'Producto fixture CA-PRECIOS-001.',
    p1Price: 1,
    p2Price: 0.9,
    vatRate: 21,
    erpStock: 100,
  },
  {
    skuErp: 'REF-002',
    title: 'Fixture CA-PRECIOS-002',
    slug: 'ref-002',
    shortDescription: 'Producto fixture CA-PRECIOS-002.',
    p1Price: 12,
    p2Price: 10,
    vatRate: 21,
    erpStock: 50,
  },
  {
    skuErp: 'REF-003',
    title: 'Fixture CA-PRECIOS-003',
    slug: 'ref-003',
    shortDescription: 'Producto fixture CA-PRECIOS-003 (oferta grupo).',
    p1Price: 12,
    p2Price: 10,
    vatRate: 21,
    erpStock: 30,
  },
  {
    skuErp: 'REF-004',
    title: 'Fixture CA-PRECIOS-004',
    slug: 'ref-004',
    shortDescription: 'Producto fixture CA-PRECIOS-004 (precio especial).',
    p1Price: 10,
    p2Price: 8,
    vatRate: 21,
    erpStock: 20,
  },
]

export async function seedJeyjoCatalog({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('— Seeding Jeyjo catalog (supplier, categories, products)...')

  const supplier = await payload.create({
    collection: 'suppliers',
    data: {
      name: 'Distrisantiago Demo',
      erpCode: 'DIST-001',
      type: 'distributor',
      baseImageUrl: 'https://example.com/distrisantiago/',
    },
    req,
  })

  const parentCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Fontanería',
      slug: 'fontaneria',
      sortOrder: 1,
    },
    req,
  })

  const childCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Grifería',
      slug: 'griferia',
      parent: parentCategory.id,
      sortOrder: 2,
    },
    req,
  })

  await payload.create({
    collection: 'products',
    data: {
      title: 'Grifo monomando cromado 35mm',
      slug: 'grifo-monomando-cromado-35mm',
      _status: 'published',
      supplier: supplier.id,
      categories: [childCategory.id],
      skuErp: 'ERP-GRF-001',
      mainWholesaleRef: 'DS-12345',
      shortDescription: 'Grifo monomando para lavabo, acabado cromado.',
      p1Price: 45.9,
      p2Price: 39.5,
      vatRate: 21,
      packUnit: 1,
      erpStock: 120,
      syncErpAt: new Date().toISOString(),
      longDescription: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Grifo de calidad para instalaciones domésticas.', version: 1 }],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      metaDescription: 'Grifo monomando cromado 35mm — compra online en Jeyjo al mejor precio.',
      keywords: [{ keyword: 'grifo' }, { keyword: 'fontanería' }],
      providerImageUrl: 'https://example.com/distrisantiago/grifo-001.jpg',
      enableVariants: false,
      priceInUSDEnabled: false,
    },
    req,
  })

  await payload.create({
    collection: 'products',
    data: {
      title: 'Manguito PVC 32mm',
      slug: 'manguito-pvc-32mm',
      _status: 'published',
      supplier: supplier.id,
      categories: [parentCategory.id],
      skuErp: 'ERP-PVC-032',
      shortDescription: 'Manguito de unión PVC diametro 32mm.',
      p1Price: 1.2,
      p2Price: 1.05,
      vatRate: 21,
      erpStock: 500,
      syncErpAt: new Date().toISOString(),
      metaDescription: 'Manguito PVC 32mm para instalaciones de fontanería.',
      enableVariants: false,
      priceInUSDEnabled: false,
    },
    req,
  })

  for (const ref of REF_FIXTURES) {
    await payload.create({
      collection: 'products',
      data: {
        title: ref.title,
        slug: ref.slug,
        _status: 'published',
        supplier: supplier.id,
        categories: [parentCategory.id],
        skuErp: ref.skuErp,
        shortDescription: ref.shortDescription,
        p1Price: ref.p1Price,
        p2Price: ref.p2Price,
        vatRate: ref.vatRate,
        packUnit: 1,
        erpStock: ref.erpStock,
        syncErpAt: new Date().toISOString(),
        metaDescription: `${ref.title} — compra online en Jeyjo.`,
        enableVariants: false,
        priceInUSDEnabled: false,
      },
      req,
    })
  }

  payload.logger.info('— Jeyjo catalog seed complete')
}
