import * as XLSX from 'xlsx'

export const MAX_EXCEL_DATA_ROWS = 500

export type ParsedExcelRow = {
  reference: string
  qty: number
  rowNumber: number
}

export type ParseExcelResult =
  | { ok: true; rows: ParsedExcelRow[] }
  | { ok: false; error: string }

const REF_HEADER = /^referencia$/i
const QTY_HEADER = /^cantidad$/i

function cellText(cell: unknown): string {
  if (cell == null) return ''
  if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell)
  return String(cell).trim()
}

function parseQty(raw: string): number {
  const n = Math.floor(Number(raw.replace(',', '.')))
  return Number.isFinite(n) ? n : NaN
}

export function parseQuickOrderExcel(buffer: ArrayBuffer): ParseExcelResult {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo Excel' }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { ok: false, error: 'El archivo no contiene hojas' }
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return { ok: false, error: 'La hoja no es legible' }
  }
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as (string | number | null)[][]

  if (matrix.length === 0) {
    return { ok: false, error: 'La hoja está vacía' }
  }

  let headerRowIndex = -1
  let refCol = -1
  let qtyCol = -1

  for (let r = 0; r < Math.min(matrix.length, 20); r++) {
    const row = matrix[r] ?? []
    for (let c = 0; c < row.length; c++) {
      const text = cellText(row[c]).normalize('NFD').replace(/\p{M}/gu, '')
      if (REF_HEADER.test(text)) refCol = c
      if (QTY_HEADER.test(text)) qtyCol = c
    }
    if (refCol >= 0 && qtyCol >= 0) {
      headerRowIndex = r
      break
    }
    refCol = -1
    qtyCol = -1
  }

  if (headerRowIndex < 0 || refCol < 0 || qtyCol < 0) {
    return {
      ok: false,
      error: 'No se encontraron columnas Referencia y Cantidad en la primera hoja',
    }
  }

  const rows: ParsedExcelRow[] = []
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    if (rows.length >= MAX_EXCEL_DATA_ROWS) break
    const row = matrix[r] ?? []
    const reference = cellText(row[refCol])
    const qtyRaw = cellText(row[qtyCol])
    if (!reference && !qtyRaw) continue
    const qty = parseQty(qtyRaw)
    rows.push({
      reference,
      qty: Number.isFinite(qty) && qty >= 1 ? qty : 0,
      rowNumber: r + 1,
    })
  }

  if (rows.length === 0) {
    return { ok: false, error: 'No hay filas de datos tras la cabecera' }
  }

  return { ok: true, rows }
}
