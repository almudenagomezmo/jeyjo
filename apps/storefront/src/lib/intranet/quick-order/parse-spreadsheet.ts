import * as XLSX from 'xlsx'

export const QUICK_ORDER_MAX_ROWS = 200
export const QUICK_ORDER_MAX_BYTES = 5 * 1024 * 1024

const REF_HEADERS = new Set(['referencia', 'reference', 'ref', 'sku'])
const QTY_HEADERS = new Set(['cantidad', 'quantity', 'qty', 'unidades'])

export type ParsedQuickOrderRow = {
  ref: string
  qty: number
  rowIndex: number
}

export type ParseSpreadsheetResult =
  | { ok: true; rows: ParsedQuickOrderRow[] }
  | { ok: false; error: string }

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function parseQty(raw: unknown): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === '') return 1
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const qty = Math.floor(n)
  if (qty <= 0) return null
  return qty
}

export function parseQuickOrderSpreadsheet(buffer: ArrayBuffer): ParseSpreadsheetResult {
  if (buffer.byteLength > QUICK_ORDER_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera el límite de 5 MB' }
  }

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo Excel' }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { ok: false, error: 'El archivo no contiene hojas' }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return { ok: false, error: 'La hoja del archivo está vacía' }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]

  if (matrix.length < 2) {
    return { ok: false, error: 'El archivo debe incluir cabecera y al menos una fila de datos' }
  }

  const headerRow = matrix[0] ?? []
  let refCol = -1
  let qtyCol = -1

  headerRow.forEach((cell, index) => {
    const h = normalizeHeader(cell)
    if (REF_HEADERS.has(h)) refCol = index
    if (QTY_HEADERS.has(h)) qtyCol = index
  })

  if (refCol < 0 || qtyCol < 0) {
    return {
      ok: false,
      error: 'Cabeceras requeridas: Referencia y Cantidad (o equivalentes en inglés)',
    }
  }

  const rows: ParsedQuickOrderRow[] = []
  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? []
    const ref = String(row[refCol] ?? '').trim()
    if (!ref) continue
    const qty = parseQty(row[qtyCol])
    if (qty === null) {
      return { ok: false, error: `Cantidad inválida en fila ${i + 1}` }
    }
    rows.push({ ref, qty, rowIndex: i + 1 })
  }

  if (rows.length === 0) {
    return { ok: false, error: 'No hay filas de datos con referencia' }
  }

  if (rows.length > QUICK_ORDER_MAX_ROWS) {
    return { ok: false, error: `Máximo ${QUICK_ORDER_MAX_ROWS} referencias por archivo` }
  }

  return { ok: true, rows }
}

export function buildQuickOrderTemplateBuffer(): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['Referencia', 'Cantidad'],
    ['REF-001', 12],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Pedido')
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return out
}
