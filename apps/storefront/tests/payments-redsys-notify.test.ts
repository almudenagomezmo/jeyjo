import { describe, expect, it, vi, beforeEach } from 'vitest'

import { processRedsysNotification } from '@/lib/payments/redsys/process-notification'

vi.mock('@/lib/payments/payload-orders', () => ({
  findPayloadOrderByNumber: vi.fn(async () => ({
    id: 42,
    orderNumber: 'JW-TEST',
    jeyjoStatus: 'pending_payment',
  })),
  updateOrderPaymentStatus: vi.fn(async () => true),
}))

vi.mock('@/lib/payments/notifications', () => ({
  insertPaymentNotification: vi
    .fn()
    .mockResolvedValueOnce('inserted')
    .mockResolvedValueOnce('duplicate'),
}))

describe('redsys notify idempotency', () => {
  beforeEach(() => {
    process.env.REDSYS_MERCHANT_CODE = '999008881'
    process.env.REDSYS_SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
    process.env.REDSYS_TERMINAL = '001'
    process.env.NEXT_PUBLIC_STOREFRONT_URL = 'http://localhost:3000'
  })

  it('processes duplicate as ok without throwing', async () => {
    const order = '12345678'
    const params = Buffer.from(
      JSON.stringify({
        Ds_Order: order,
        Ds_Amount: '1000',
        Ds_Response: '0000',
        Ds_MerchantCode: '999008881',
        Ds_Currency: '978',
        Ds_TransactionType: '0',
        Ds_SecurePayment: '1',
      }),
      'utf8',
    ).toString('base64')

    const { signNotificationFields } = await import('@/lib/payments/redsys/sign')
    const fields = {
      Ds_Amount: '1000',
      Ds_Order: order,
      Ds_MerchantCode: '999008881',
      Ds_Currency: '978',
      Ds_Response: '0000',
      Ds_TransactionType: '0',
      Ds_SecurePayment: '1',
    }
    const signature = signNotificationFields(fields, process.env.REDSYS_SECRET_KEY!)!

    const first = await processRedsysNotification({ merchantParameters: params, signature })
    const second = await processRedsysNotification({ merchantParameters: params, signature })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(second.duplicate).toBe(true)
  })
})
