import ExcelJS from 'exceljs'
import { describe, it, expect } from 'vitest'

import {
  IMPORTACION_ARTICULOS_HEADERS,
  parseImportacionArticulos,
  serializeImportacionArticulos,
  createExcelCatalogReader,
  createExcelCatalogWriter,
  isValidEan,
} from '../src/index.js'

async function buildTestWorkbook(rows: Array<Record<string, string | number>>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Articulos')
  sheet.addRow([...IMPORTACION_ARTICULOS_HEADERS])
  for (const row of rows) {
    sheet.addRow(
      IMPORTACION_ARTICULOS_HEADERS.map((h) => {
        const v = row[h]
        return v ?? ''
      }),
    )
  }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

describe('parseImportacionArticulos', () => {
  it('parses valid rows and flags wildcard', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      Referencia: i === 25 ? '9000000001' : `REF-${String(i + 1).padStart(3, '0')}`,
      Descripcion: `Producto ${i + 1}`,
      PrecioP1: 10 + i * 0.1,
      PrecioP2: 8 + i * 0.1,
      IVA: 21,
      UnidadesEnvase: 1,
      CodigoEAN: '',
      RefMayorista: '',
      RefOEM: '',
      CodigoProveedor: '',
      Stock: 10,
      Categoria: '',
      EstadoPublicacion: '',
      MetaDescripcion: '',
      UrlAmigable: '',
    }))

    const buffer = await buildTestWorkbook(rows)
    const result = await parseImportacionArticulos(buffer, { wildcardSkus: ['9000000001'] })

    expect(result.summary.validRows).toBe(50)
    expect(result.wildcards).toBe(1)
    expect(result.products.find((p) => p.skuErp === '9000000001')?.isWildcard).toBe(true)
    expect(result.errors.filter((e) => e.blocking)).toHaveLength(0)
  })

  it('returns blocking error when Referencia column is missing', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Articulos')
    sheet.addRow(['Descripcion', 'PrecioP1'])
    sheet.addRow(['Sin ref', 10])
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

    const result = await parseImportacionArticulos(buffer)
    expect(result.products).toHaveLength(0)
    expect(result.errors.some((e) => e.blocking && e.message.includes('Referencia'))).toBe(true)
  })

  it('reports invalid price on row', async () => {
    const buffer = await buildTestWorkbook([
      {
        Referencia: 'REF-BAD',
        Descripcion: 'Bad',
        PrecioP1: 'no-num',
        PrecioP2: 5,
        IVA: 21,
        UnidadesEnvase: 1,
        CodigoEAN: '',
        RefMayorista: '',
        RefOEM: '',
        CodigoProveedor: '',
        Stock: '',
        Categoria: '',
        EstadoPublicacion: '',
        MetaDescripcion: '',
        UrlAmigable: '',
      },
    ])

    const result = await parseImportacionArticulos(buffer)
    expect(result.products).toHaveLength(0)
    expect(result.errors.some((e) => e.code === 'INVALID_PRICE')).toBe(true)
  })
})

describe('EAN validation', () => {
  it('accepts valid EAN-13', () => {
    expect(isValidEan('4006381333931')).toBe(true)
  })

  it('rejects invalid check digit', () => {
    expect(isValidEan('4006381333930')).toBe(false)
  })
})

describe('Excel catalog adapter', () => {
  it('reader paginates in-memory products', async () => {
    const buffer = await buildTestWorkbook([
      {
        Referencia: 'REF-001',
        Descripcion: 'A',
        PrecioP1: 1,
        PrecioP2: 1,
        IVA: 21,
        UnidadesEnvase: 1,
        CodigoEAN: '',
        RefMayorista: '',
        RefOEM: '',
        CodigoProveedor: '',
        Stock: '',
        Categoria: '',
        EstadoPublicacion: '',
        MetaDescripcion: '',
        UrlAmigable: '',
      },
    ])
    const parsed = await parseImportacionArticulos(buffer)
    const reader = createExcelCatalogReader({
      products: parsed.products,
      suppliers: parsed.suppliers,
    })

    const page = await reader.listProducts({ limit: 10 })
    expect(page.items).toHaveLength(1)
    expect(await reader.getProductBySku('REF-001')).toMatchObject({ skuErp: 'REF-001' })
  })

  it('writer flush produces xlsx buffer', async () => {
    const writer = createExcelCatalogWriter()
    await writer.upsertProduct({
      skuErp: 'REF-001',
      p1Price: 10,
      p2Price: 8,
      vatRate: 21,
    })
    const buffer = await writer.flush()
    expect(buffer.byteLength).toBeGreaterThan(100)

    const roundTrip = await parseImportacionArticulos(buffer)
    expect(roundTrip.products[0]?.skuErp).toBe('REF-001')
  })
})

describe('serializeImportacionArticulos', () => {
  it('round-trips through parse', async () => {
    const buffer = await serializeImportacionArticulos([
      {
        skuErp: 'REF-XYZ',
        shortDescription: 'Test',
        p1Price: 12.5,
        p2Price: 10,
        vatRate: 21,
      },
    ])
    const parsed = await parseImportacionArticulos(buffer)
    expect(parsed.products[0]?.skuErp).toBe('REF-XYZ')
    expect(parsed.products[0]?.p1Price).toBe(12.5)
  })
})
