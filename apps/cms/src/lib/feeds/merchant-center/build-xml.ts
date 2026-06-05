import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

import type { MerchantFeedAvailability } from './types'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function mapStockToMerchantAvailability(input: {
  stockIndicator?: StockIndicatorLevel | null
  allowOrderWithoutStock?: boolean | null
}): MerchantFeedAvailability {
  const level = input.stockIndicator
  if (level === 'available' || level === 'low') return 'in_stock'
  if (level === 'limited') {
    return input.allowOrderWithoutStock ? 'preorder' : 'in_stock'
  }
  return 'out_of_stock'
}

export function formatMerchantPrice(p1Price: number, vatRate: number): string {
  const gross = p1Price * (1 + vatRate / 100)
  return `${gross.toFixed(2)} EUR`
}

export function buildMerchantFeedXml(
  rows: Array<{
    id: string
    title: string
    description: string
    link: string
    imageLink: string
    price: string
    availability: MerchantFeedAvailability
    brand?: string
    gtin?: string
  }>,
): string {
  const items = rows
    .map((row) => {
      const parts = [
        '<item>',
        `<g:id>${escapeXml(row.id)}</g:id>`,
        `<title>${escapeXml(row.title)}</title>`,
        `<description>${escapeXml(row.description)}</description>`,
        `<link>${escapeXml(row.link)}</link>`,
        `<g:image_link>${escapeXml(row.imageLink)}</g:image_link>`,
        `<g:price>${escapeXml(row.price)}</g:price>`,
        `<g:availability>${row.availability}</g:availability>`,
      ]
      if (row.brand) parts.push(`<g:brand>${escapeXml(row.brand)}</g:brand>`)
      if (row.gtin) parts.push(`<g:gtin>${escapeXml(row.gtin)}</g:gtin>`)
      parts.push('</item>')
      return parts.join('')
    })
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    '<title>Jeyjo Product Feed</title>',
    '<link>https://www.jeyjo.com</link>',
    '<description>Google Merchant Center feed</description>',
    items,
    '</channel>',
    '</rss>',
  ].join('')
}
