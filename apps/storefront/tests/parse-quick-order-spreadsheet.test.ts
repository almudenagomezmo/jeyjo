import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import {
  buildQuickOrderTemplateBuffer,
  parseQuickOrderSpreadsheet,
} from '@/lib/intranet/quick-order/parse-spreadsheet'

function sheetBuffer(rows: unknown[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Pedido')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseQuickOrderSpreadsheet', () => {
  it('parses Spanish headers and defaults empty qty to 1', () => {
    const buf = sheetBuffer([
      ['Referencia', 'Cantidad'],
      ['REF-001', ''],
      ['REF-002', 5],
    ])
    const result = parseQuickOrderSpreadsheet(buf)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows).toEqual([
      { ref: 'REF-001', qty: 1, rowIndex: 2 },
      { ref: 'REF-002', qty: 5, rowIndex: 3 },
    ])
  })

  it('parses English headers', () => {
    const buf = sheetBuffer([
      ['Reference', 'Qty'],
      ['REF-EN', 3],
    ])
    const result = parseQuickOrderSpreadsheet(buf)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows[0]?.ref).toBe('REF-EN')
  })

  it('rejects invalid quantity', () => {
    const buf = sheetBuffer([
      ['Referencia', 'Cantidad'],
      ['REF-001', 0],
    ])
    const result = parseQuickOrderSpreadsheet(buf)
    expect(result.ok).toBe(false)
  })

  it('builds template buffer', () => {
    const buf = buildQuickOrderTemplateBuffer()
    const parsed = parseQuickOrderSpreadsheet(buf)
    expect(parsed.ok).toBe(true)
  })
})
