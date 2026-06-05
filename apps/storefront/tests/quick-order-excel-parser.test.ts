import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { MAX_EXCEL_DATA_ROWS, parseQuickOrderExcel } from '@/lib/intranet/quick-order/excel-parser'

function toBuffer(rows: (string | number)[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja1')
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return out
}

describe('parseQuickOrderExcel', () => {
  it('parses Referencia and Cantidad headers', () => {
    const buf = toBuffer([
      ['Referencia', 'Cantidad'],
      ['REF-001', 2],
      ['REF-002', 4],
    ])
    const result = parseQuickOrderExcel(buf)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ reference: 'REF-001', qty: 2 })
  })

  it('accepts headers without accent', () => {
    const buf = toBuffer([
      ['referencia', 'cantidad'],
      ['REF-003', 1],
    ])
    const result = parseQuickOrderExcel(buf)
    expect(result.ok).toBe(true)
  })

  it('rejects file without required columns', () => {
    const buf = toBuffer([
      ['SKU', 'Qty'],
      ['REF-001', 1],
    ])
    const result = parseQuickOrderExcel(buf)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Referencia')
  })

  it('stops at max row limit', () => {
    const header: (string | number)[][] = [['Referencia', 'Cantidad']]
    const data = Array.from({ length: MAX_EXCEL_DATA_ROWS + 10 }, (_, i) => [
      `REF-${i}`,
      1,
    ])
    const buf = toBuffer([...header, ...data])
    const result = parseQuickOrderExcel(buf)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows.length).toBe(MAX_EXCEL_DATA_ROWS)
  })
})
