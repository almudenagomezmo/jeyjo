import ExcelJS from 'exceljs'

import { AVANSUITE_COLUMN_HEADERS } from './columns.js'
import type { AvansuiteRow, OrderExportInput } from './types.js'
import { buildAvansuiteOrderRows } from './build-rows.js'

function rowToSheetValues(row: AvansuiteRow): (string | number)[] {
  return [
    row.webOrderNumber,
    row.orderDate,
    row.customerErpCode,
    row.customerTaxId,
    row.skuErp,
    row.quantity,
    row.unitPrice,
    row.lineDiscount,
  ]
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, '-').slice(0, 31)
  return cleaned || 'Pedido'
}

async function addSheetForOrder(
  workbook: ExcelJS.Workbook,
  order: OrderExportInput,
  sheetIndex: number,
): Promise<void> {
  const baseName = sanitizeSheetName(order.orderNumber)
  const sheetName = workbook.getWorksheet(baseName)
    ? `${baseName.slice(0, 28)}_${sheetIndex}`
    : baseName

  const sheet = workbook.addWorksheet(sheetName)
  sheet.addRow([...AVANSUITE_COLUMN_HEADERS])
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }

  for (const row of buildAvansuiteOrderRows(order)) {
    sheet.addRow(rowToSheetValues(row))
  }
}

export async function serializeAvansuiteXlsx(orders: OrderExportInput[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Jeyjo OMS'

  if (orders.length === 1) {
    await addSheetForOrder(workbook, orders[0]!, 0)
  } else {
    let index = 0
    for (const order of orders) {
      await addSheetForOrder(workbook, order, index++)
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
