import type { ErpProductDto, ErpSupplierDto } from '@jeyjo/erp-ports'

export type ParseRowErrorCode =
  | 'INVALID_PRICE'
  | 'INVALID_VAT'
  | 'INVALID_STOCK'
  | 'INVALID_PACK_UNIT'
  | 'INVALID_EAN'
  | 'MISSING_SKU'
  | 'MISSING_PRICE'

export type ParseRowError = {
  line: number
  column?: string
  code: ParseRowErrorCode | 'WORKBOOK_ERROR'
  message: string
  blocking: boolean
}

export type ParseImportResult = {
  products: ErpProductDto[]
  suppliers: ErpSupplierDto[]
  errors: ParseRowError[]
  wildcards: number
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
  }
}

export type SerializeProductRow = ErpProductDto & {
  categoryName?: string | null
  publicationStatus?: string | null
  metaDescription?: string | null
  slug?: string | null
}
