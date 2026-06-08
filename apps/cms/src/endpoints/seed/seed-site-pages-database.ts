import type { Payload, PayloadRequest } from 'payload'

const LEGAL_SLUGS = [
  'aviso-legal',
  'privacidad',
  'cookies',
  'condiciones-compra',
  'envios',
  'devoluciones',
  'formas-pago',
  'contacto',
] as const

function placeholderLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const FAQ_CONTENT = placeholderLexical(
  'Preguntas frecuentes — borrador pendiente de revisión por el equipo de Jeyjo. ' +
    'Consulta envíos en /legal/envios, devoluciones en /legal/devoluciones o contacta por teléfono o email.',
)

export async function seedSitePagesDatabase({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  for (const slug of LEGAL_SLUGS) {
    const existing = await payload.find({
      collection: 'site-pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      req,
    })

    const title = slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    const data = {
      title,
      slug,
      pageType: 'legal' as const,
      published: true,
      metaDescription: `${title} — Jeyjo Material de Oficina`,
      content: placeholderLexical(
        `${title}: contenido provisional. Pendiente de revisión legal antes de go-live.`,
      ),
    }

    if (existing.docs[0]) {
      await payload.update({
        collection: 'site-pages',
        id: existing.docs[0].id,
        data: data as Record<string, unknown>,
        req,
        context: { seedSitePages: true },
      })
    } else {
      await payload.create({
        collection: 'site-pages',
        data: data as Record<string, unknown>,
        req,
        context: { seedSitePages: true },
      })
    }
  }

  const faqExisting = await payload.find({
    collection: 'site-pages',
    where: { slug: { equals: 'faq' } },
    limit: 1,
    depth: 0,
    req,
  })

  const faqData = {
    title: 'Preguntas frecuentes',
    slug: 'faq',
    pageType: 'faq' as const,
    published: true,
    metaDescription: 'Preguntas frecuentes sobre compras, envíos y devoluciones en Jeyjo.',
    content: FAQ_CONTENT,
  }

  if (faqExisting.docs[0]) {
    await payload.update({
      collection: 'site-pages',
      id: faqExisting.docs[0].id,
      data: faqData as Record<string, unknown>,
      req,
      context: { seedSitePages: true },
    })
  } else {
    await payload.create({
      collection: 'site-pages',
      data: faqData as Record<string, unknown>,
      req,
      context: { seedSitePages: true },
    })
  }
}
