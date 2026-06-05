import ExcelJS from 'exceljs'

import { COLUMN_ALIASES } from './columns.js'
import { isValidEan } from './ean.js'
import type { ParseImportResult, ParseRowError } from './types.js'
import type { ErpProductDto, ErpSupplierDto } from '@jeyjo/erp-ports'

const MAX_ROWS = 20_000

export type ParseImportOptions = {
  wildcardSkus?: string[]
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '')
}

function cellString(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (typeof value === 'object' && 'text' in value && value.text != null) {
    return String(value.text).trim()
  }
  if (typeof value === 'object' && 'result' in value && value.result != null) {
    return String(value.result).trim()
  }
  return String(value).trim()
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  const raw = cellString(value).replace(',', '.')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function detectHeaderRow(sheet: ExcelJS.Worksheet): { rowIndex: number; columnMap: Map<string, number> } | null {
  for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
    const row = sheet.getRow(r)
    const columnMap = new Map<string, number>()

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const normalized = normalizeHeader(cell.value)
      const canonical = COLUMN_ALIASES[normalized]
      if (canonical) {
        columnMap.set(canonical, colNumber)
      }
    })

    if (columnMap.has('Referencia')) {
      return { rowIndex: r, columnMap }
    }
  }
  return null
}

function getCell(row: ExcelJS.Row, columnMap: Map<string, number>, key: string): ExcelJS.CellValue {
  const col = columnMap.get(key)
  if (!col) return null
  return row.getCell(col).value
}

function defaultWildcardSkus(): string[] {
  const raw = process.env.ERP_WILDCARD_SKUS ?? '9000000001'
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function parseImportacionArticulos(
  input: Buffer | ArrayBuffer,
  options?: ParseImportOptions,
): Promise<ParseImportResult> {
  const workbook = new ExcelJS.Workbook()
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  const errors: ParseRowError[] = []
  const products: ErpProductDto[] = []
  const supplierNames = new Map<string, ErpSupplierDto>()
  const wildcardSet = new Set(options?.wildcardSkus ?? defaultWildcardSkus())
  let wildcards = 0
  let warningRows = 0

  if (!sheet) {
    return {
      products: [],
      suppliers: [],
      errors: [
        {
          line: 0,
          code: 'WORKBOOK_ERROR',
          message: 'El libro no contiene hojas',
          blocking: true,
        },
      ],
      wildcards: 0,
      summary: { totalRows: 0, validRows: 0, errorRows: 1, warningRows: 0 },
    }
  }

  const header = detectHeaderRow(sheet)
  if (!header) {
    return {
      products: [],
      suppliers: [],
      errors: [
        {
          line: 0,
          code: 'WORKBOOK_ERROR',
          message: 'No se encontró columna Referencia en la primera hoja',
          blocking: true,
        },
      ],
      wildcards: 0,
      summary: { totalRows: 0, validRows: 0, errorRows: 1, warningRows: 0 },
    }
  }

  const { rowIndex, columnMap } = header
  let totalRows = 0
  let validRows = 0
  let errorRows = 0

  for (let r = rowIndex + 1; r <= sheet.rowCount && totalRows < MAX_ROWS; r++) {
    const row = sheet.getRow(r)
    const sku = cellString(getCell(row, columnMap, 'Referencia'))
    if (!sku) continue

    totalRows += 1
    const rowErrors: ParseRowError[] = []
    const line = r

    const p1 = cellNumber(getCell(row, columnMap, 'PrecioP1'))
    const p2 = cellNumber(getCell(row, columnMap, 'PrecioP2'))

    if (p1 == null && p2 == null) {
      rowErrors.push({
        line,
        column: 'PrecioP1',
        code: 'MISSING_PRICE',
        message: 'Falta al menos PrecioP1 o PrecioP2',
        blocking: true,
      })
    }
    if (getCell(row, columnMap, 'PrecioP1') && p1 == null) {
      rowErrors.push({
        line,
        column: 'PrecioP1',
        code: 'INVALID_PRICE',
        message: 'PrecioP1 no numérico',
        blocking: true,
      })
    }
    if (getCell(row, columnMap, 'PrecioP2') && p2 == null) {
      rowErrors.push({
        line,
        column: 'PrecioP2',
        code: 'INVALID_PRICE',
        message: 'PrecioP2 no numérico',
        blocking: true,
      })
    }

    const vatRaw = getCell(row, columnMap, 'IVA')
    const vatRate = vatRaw != null && cellString(vatRaw) !== '' ? cellNumber(vatRaw) : null
    if (vatRaw != null && cellString(vatRaw) !== '' && vatRate == null) {
      rowErrors.push({
        line,
        column: 'IVA',
        code: 'INVALID_VAT',
        message: 'IVA no numérico',
        blocking: true,
      })
    }

    const packRaw = getCell(row, columnMap, 'UnidadesEnvase')
    const packUnit =
      packRaw != null && cellString(packRaw) !== '' ? cellNumber(packRaw) : null
    if (packRaw != null && cellString(packRaw) !== '' && (packUnit == null || packUnit <= 0)) {
      rowErrors.push({
        line,
        column: 'UnidadesEnvase',
        code: 'INVALID_PACK_UNIT',
        message: 'UnidadesEnvase debe ser un entero positivo',
        blocking: true,
      })
    }

    const stockRaw = getCell(row, columnMap, 'Stock')
    const erpStock =
      stockRaw != null && cellString(stockRaw) !== '' ? cellNumber(stockRaw) : null
    if (stockRaw != null && cellString(stockRaw) !== '' && erpStock == null) {
      rowErrors.push({
        line,
        column: 'Stock',
        code: 'INVALID_STOCK',
        message: 'Stock no numérico',
        blocking: true,
      })
    }

    const ean = cellString(getCell(row, columnMap, 'CodigoEAN')) || null
    if (ean && !isValidEan(ean)) {
      rowErrors.push({
        line,
        column: 'CodigoEAN',
        code: 'INVALID_EAN',
        message: `EAN inválido: ${ean}`,
        blocking: true,
      })
    }

    const blocking = rowErrors.filter((e) => e.blocking)
    if (blocking.length > 0) {
      errors.push(...rowErrors)
      errorRows += 1
      continue
    }

    const isWildcard = wildcardSet.has(sku)
    if (isWildcard) wildcards += 1

    const supplierCode = cellString(getCell(row, columnMap, 'CodigoProveedor')) || null
    if (supplierCode && !supplierNames.has(supplierCode)) {
      supplierNames.set(supplierCode, {
        erpCode: supplierCode,
        name: supplierCode,
        type: 'other',
      })
    }

    const categoryName = cellString(getCell(row, columnMap, 'Categoria')) || null
    if (categoryName) {
      warningRows += 1
      errors.push({
        line,
        column: 'Categoria',
        code: 'WORKBOOK_ERROR',
        message: `Categoría "${categoryName}" se resolverá en apply si existe en Payload`,
        blocking: false,
      })
    }

    const dto: ErpProductDto = {
      skuErp: sku,
      shortDescription: cellString(getCell(row, columnMap, 'Descripcion')) || null,
      p1Price: p1,
      p2Price: p2,
      vatRate,
      packUnit: packUnit != null ? Math.trunc(packUnit) : null,
      ean,
      mainWholesaleRef: cellString(getCell(row, columnMap, 'RefMayorista')) || null,
      oemRef: cellString(getCell(row, columnMap, 'RefOEM')) || null,
      supplierErpCode: supplierCode,
      erpStock: erpStock != null ? Math.trunc(erpStock) : null,
      isWildcard,
    }

    products.push(dto)
    validRows += 1
  }

  return {
    products,
    suppliers: [...supplierNames.values()],
    errors,
    wildcards,
    summary: {
      totalRows,
      validRows,
      errorRows,
      warningRows,
    },
  }
}
