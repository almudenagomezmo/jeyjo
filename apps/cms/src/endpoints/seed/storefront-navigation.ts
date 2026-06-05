import type { Payload, PayloadRequest } from 'payload'

/**
 * Demo taxonomy aligned with storefront static CATEGORIES for local QA.
 * Seeds root categories and subcategories (2 levels); families can be added later.
 */
/** Taxonomía alineada con jeyjo.es y el fallback estático del storefront */
const DEMO_TAXONOMY = [
  {
    slug: 'escritura',
    title: 'Escritura y corrección',
    sortOrder: 1,
    homeGlyph: 'pen' as const,
    children: [
      { slug: 'boligrafos', title: 'Bolígrafos', sortOrder: 1 },
      { slug: 'rotuladores', title: 'Rotuladores y marcadores', sortOrder: 2 },
      { slug: 'lapices', title: 'Lápices y portaminas', sortOrder: 3 },
      { slug: 'correccion', title: 'Corrección', sortOrder: 4 },
    ],
  },
  {
    slug: 'papel',
    title: 'Papel y blocs',
    sortOrder: 2,
    homeGlyph: 'paper' as const,
    children: [
      { slug: 'folios', title: 'Folios A4 y A3', sortOrder: 1 },
      { slug: 'cuadernos', title: 'Cuadernos y blocs', sortOrder: 2 },
      { slug: 'manualidades', title: 'Manualidades y escolar', sortOrder: 3 },
      { slug: 'sobres', title: 'Sobres y mensajería', sortOrder: 4 },
    ],
  },
  {
    slug: 'impresion',
    title: 'Impresión y tinta',
    sortOrder: 3,
    homeGlyph: 'toner' as const,
    children: [
      { slug: 'toner', title: 'Tóner láser', sortOrder: 1 },
      { slug: 'tinta', title: 'Cartuchos de tinta', sortOrder: 2 },
      { slug: 'impresoras', title: 'Impresoras y multifunción', sortOrder: 3 },
      { slug: 'etiquetas', title: 'Etiquetas adhesivas', sortOrder: 4 },
    ],
  },
  {
    slug: 'archivo',
    title: 'Archivo y carpetería',
    sortOrder: 4,
    homeGlyph: 'folder' as const,
    children: [
      { slug: 'archivadores', title: 'Archivadores AZ', sortOrder: 1 },
      { slug: 'carpetas', title: 'Carpetas y fundas', sortOrder: 2 },
      { slug: 'separadores', title: 'Subcarpetas y separadores', sortOrder: 3 },
      { slug: 'cajas', title: 'Cajas archivo', sortOrder: 4 },
    ],
  },
  {
    slug: 'oficina',
    title: 'Material de oficina',
    sortOrder: 5,
    homeGlyph: 'stapler' as const,
    children: [
      { slug: 'grapado', title: 'Grapadoras y grapas', sortOrder: 1 },
      { slug: 'corte', title: 'Tijeras y cúter', sortOrder: 2 },
      { slug: 'calculadoras', title: 'Calculadoras', sortOrder: 3 },
      { slug: 'adhesivos', title: 'Cintas adhesivas', sortOrder: 4 },
    ],
  },
  {
    slug: 'reciclaje',
    title: 'Reciclaje y limpieza',
    sortOrder: 6,
    homeGlyph: 'recycle' as const,
    children: [
      { slug: 'papeleras', title: 'Papeleras de reciclaje', sortOrder: 1 },
      { slug: 'pilas', title: 'Pilas y baterías', sortOrder: 2 },
      { slug: 'contenedores', title: 'Contenedores', sortOrder: 3 },
      { slug: 'limpieza', title: 'Limpieza oficina', sortOrder: 4 },
    ],
  },
] as const

export async function seedStorefrontNavigationCategories({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('— Seeding storefront navigation categories (jeyjo.es taxonomy)...')

  for (const root of DEMO_TAXONOMY) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: root.slug } },
      limit: 1,
      depth: 0,
    })

    const rootDoc =
      existing.docs[0] ??
      (await payload.create({
        collection: 'categories',
        data: {
          title: root.title,
          slug: root.slug,
          sortOrder: root.sortOrder,
          homeGlyph: root.homeGlyph,
        },
        req,
      }))

    for (const child of root.children) {
      const childExisting = await payload.find({
        collection: 'categories',
        where: { slug: { equals: child.slug } },
        limit: 1,
        depth: 0,
      })

      if (childExisting.docs[0]) continue

      await payload.create({
        collection: 'categories',
        data: {
          title: child.title,
          slug: child.slug,
          sortOrder: child.sortOrder,
          parent: rootDoc.id,
        },
        req,
      })
    }
  }

  payload.logger.info('— Storefront navigation categories seed complete')
}
