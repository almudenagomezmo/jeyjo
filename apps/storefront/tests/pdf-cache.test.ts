import { describe, expect, it } from 'vitest'

import {
  assertCustomerStoragePrefix,
  buildDocumentMetaPath,
  buildDocumentStoragePath,
} from '@/lib/documents/pdf-cache'

describe('pdf-cache paths', () => {
  it('builds customer-scoped storage path', () => {
    expect(buildDocumentStoragePath('cust-1', 'invoice', 'INV-001')).toBe(
      'cust-1/invoice/INV-001.pdf',
    )
  })

  it('rejects cross-customer prefix', () => {
    expect(() => assertCustomerStoragePrefix('cust-1', 'cust-2/invoice/x.pdf')).toThrow(
      'Cross-customer',
    )
  })

  it('builds meta path alongside pdf', () => {
    const pdfPath = buildDocumentStoragePath('cust-1', 'delivery_note', 'DN-1')
    expect(buildDocumentMetaPath(pdfPath)).toBe(`${pdfPath}.meta.json`)
  })
})
