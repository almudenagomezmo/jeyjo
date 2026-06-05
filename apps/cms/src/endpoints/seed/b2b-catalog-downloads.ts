import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Payload } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function minimalPdfFile(): { name: string; data: Buffer; mimetype: string; size: number } {
  const fixturePath = path.resolve(dirname, '../../../tests/fixtures/catalog-minimal.pdf')
  const data = fs.readFileSync(fixturePath)
  return {
    name: 'catalog-minimal.pdf',
    data,
    mimetype: 'application/pdf',
    size: data.byteLength,
  }
}

export async function seedB2bCatalogDownloads(payload: Payload): Promise<void> {
  const existing = await payload.find({
    collection: 'b2b-catalog-downloads',
    where: { title: { equals: 'Catálogo General 2026' } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return

  const pdfFile = minimalPdfFile()

  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Catálogo General 2026 PDF' },
    file: pdfFile,
  })

  const year = new Date().getFullYear()

  await payload.create({
    collection: 'b2b-catalog-downloads',
    data: {
      title: 'Catálogo General 2026',
      description: 'Catálogo comercial vigente para clientes B2B.',
      documentType: 'catalog',
      file: media.id,
      validFrom: `${year}-01-01`,
      validUntil: `${year}-12-31`,
      published: true,
    },
    depth: 0,
  })

  await payload.create({
    collection: 'b2b-catalog-downloads',
    data: {
      title: 'Ofertas Q1 2025',
      description: 'Revista de ofertas caducada (fixture de prueba).',
      documentType: 'offer_magazine',
      file: media.id,
      validFrom: '2025-01-01',
      validUntil: '2025-03-31',
      published: true,
    },
    depth: 0,
  })

  payload.logger.info('— Seeded B2B catalog downloads (vigente + caducado)')
}
