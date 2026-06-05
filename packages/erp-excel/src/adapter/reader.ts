import { readFile } from 'node:fs/promises'

import type { ErpCatalogReader } from '@jeyjo/erp-ports'
import type { ErpProductDto, ErpSupplierDto } from '@jeyjo/erp-ports'
import type { ErpPageOptions, ErpPageResult } from '@jeyjo/erp-ports'

import { parseImportacionArticulos } from '../parse.js'

function pageSlice<T>(items: T[], options?: ErpPageOptions): ErpPageResult<T> {
  const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
  const offset = options?.cursor ? Number.parseInt(options.cursor, 10) : 0
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0
  const slice = items.slice(safeOffset, safeOffset + limit)
  const nextOffset = safeOffset + limit
  const hasMore = nextOffset < items.length
  return {
    items: slice,
    nextCursor: hasMore ? String(nextOffset) : null,
    hasMore,
  }
}

export type ExcelCatalogReaderSource = {
  products: ErpProductDto[]
  suppliers: ErpSupplierDto[]
}

export function createExcelCatalogReader(source: ExcelCatalogReaderSource): ErpCatalogReader {
  const productIndex = new Map(source.products.map((p) => [p.skuErp, p]))

  return {
    async listProducts(options) {
      return pageSlice(source.products, options)
    },

    async getProductBySku(skuErp) {
      return productIndex.get(skuErp) ?? null
    },

    async listSuppliers(options) {
      return pageSlice(source.suppliers, options)
    },
  }
}

export async function createExcelCatalogReaderFromFile(filePath: string): Promise<ErpCatalogReader> {
  const buffer = await readFile(filePath)
  const parsed = await parseImportacionArticulos(buffer)
  if (parsed.errors.some((e) => e.blocking)) {
    throw new Error(
      `Excel catalog file has blocking errors: ${parsed.errors
        .filter((e) => e.blocking)
        .slice(0, 3)
        .map((e) => e.message)
        .join('; ')}`,
    )
  }
  return createExcelCatalogReader({
    products: parsed.products,
    suppliers: parsed.suppliers,
  })
}

export async function createExcelCatalogReaderFromBuffer(buffer: Buffer): Promise<ErpCatalogReader> {
  const parsed = await parseImportacionArticulos(buffer)
  return createExcelCatalogReader({
    products: parsed.products,
    suppliers: parsed.suppliers,
  })
}
