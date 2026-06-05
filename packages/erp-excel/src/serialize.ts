import ExcelJS from 'exceljs'

import { IMPORTACION_ARTICULOS_HEADERS } from './columns.js'
import type { SerializeProductRow } from './types.js'

function rowValues(row: SerializeProductRow): (string | number)[] {
  return [
    row.skuErp,
    row.shortDescription ?? '',
    row.p1Price ?? '',
    row.p2Price ?? '',
    row.vatRate ?? '',
    row.packUnit ?? '',
    row.ean ?? '',
    row.mainWholesaleRef ?? '',
    row.oemRef ?? '',
    row.supplierErpCode ?? '',
    row.erpStock ?? '',
    row.categoryName ?? '',
    row.publicationStatus ?? '',
    row.metaDescription ?? '',
    row.slug ?? '',
  ]
}

export async function serializeImportacionArticulos(rows: SerializeProductRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Jeyjo PIM'
  const sheet = workbook.addWorksheet('Articulos')
  sheet.addRow([...IMPORTACION_ARTICULOS_HEADERS])
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }

  for (const row of rows) {
    sheet.addRow(rowValues(row))
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function serializeImportacionArticulosTemplate(): Promise<Buffer> {
  return serializeImportacionArticulos([
    {
      skuErp: 'REF-EJEMPLO',
      shortDescription: 'Artículo de ejemplo',
      p1Price: 10,
      p2Price: 8.5,
      vatRate: 21,
      packUnit: 1,
      ean: '4006381333931',
      mainWholesaleRef: 'DS-001',
      oemRef: 'OEM-001',
      supplierErpCode: 'PROV-01',
      erpStock: 100,
      categoryName: 'Papelería',
      publicationStatus: 'published',
    },
  ])
}
