import { describe, expect, it } from 'vitest'

import { buildRedsysRedirectForm } from '@/lib/payments/redsys/build-redirect'
import { normalizeRedsysOrderRef } from '@/lib/payments/redsys/config'
import {
  encodeMerchantParameters,
  signMerchantParameters,
  verifyNotificationSignature,
  type RedsysNotificationFields,
} from '@/lib/payments/redsys/sign'
import { isRedsysResponseAuthorized, parseRedsysNotification } from '@/lib/payments/redsys/parse-notification'
import { PaymentMethodDisabledError, resolvePaymentNextStep } from '@/lib/payments/orchestrator'

describe('redsys sign', () => {
  /** Redsys test merchant secret (Base64, 24 bytes decoded). */
  const secretKey = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
  const order = '12345678'

  it('signs merchant parameters deterministically', () => {
    const params = encodeMerchantParameters({
      DS_MERCHANT_AMOUNT: '4500',
      DS_MERCHANT_ORDER: order,
      DS_MERCHANT_CURRENCY: '978',
    })
    const sig1 = signMerchantParameters(params, order, secretKey)
    const sig2 = signMerchantParameters(params, order, secretKey)
    expect(sig1).toBe(sig2)
    expect(sig1.length).toBeGreaterThan(10)
  })

  it('verifies notification signature string', async () => {
    const { signNotificationFields } = await import('@/lib/payments/redsys/sign')
    const fields: RedsysNotificationFields = {
      Ds_Amount: '4500',
      Ds_Order: order,
      Ds_MerchantCode: '999008881',
      Ds_Currency: '978',
      Ds_Response: '0000',
      Ds_TransactionType: '0',
      Ds_SecurePayment: '1',
    }
    const derivedSig = signNotificationFields(fields, secretKey)
    expect(derivedSig).toBeTruthy()
    expect(verifyNotificationSignature(fields, derivedSig!, secretKey)).toBe(true)
  })
})

describe('redsys parse notification', () => {
  it('marks 0000 as authorized', () => {
    expect(isRedsysResponseAuthorized('0000')).toBe(true)
    expect(isRedsysResponseAuthorized('0099')).toBe(true)
    expect(isRedsysResponseAuthorized('0101')).toBe(false)
  })

  it('parses base64 merchant parameters', () => {
    const inner = Buffer.from(
      JSON.stringify({
        Ds_Order: '12345678',
        Ds_Amount: '4500',
        Ds_Response: '0000',
        Ds_AuthorisationCode: '123456',
      }),
      'utf8',
    ).toString('base64')
    const parsed = parseRedsysNotification(inner)
    expect(parsed.authorized).toBe(true)
    expect(parsed.amountCents).toBe(4500)
  })
})

describe('redsys build redirect', () => {
  it('builds form with valid order ref and amount', () => {
    process.env.REDSYS_MERCHANT_CODE = '999008881'
    process.env.REDSYS_SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
    process.env.REDSYS_TERMINAL = '001'
    process.env.NEXT_PUBLIC_STOREFRONT_URL = 'http://localhost:3000'

    const ref = normalizeRedsysOrderRef('JW-ABC123')
    expect(ref.length).toBeGreaterThanOrEqual(4)
    expect(ref.length).toBeLessThanOrEqual(12)

    const form = buildRedsysRedirectForm({
      orderNumber: 'JW-TEST1',
      amountCents: 4500,
      method: 'card',
    })
    expect(form?.merchantParameters).toBeTruthy()
    expect(form?.signature).toBeTruthy()
    expect(form?.tpvUrl).toContain('redsys')

    delete process.env.REDSYS_MERCHANT_CODE
    delete process.env.REDSYS_SECRET_KEY
    delete process.env.REDSYS_TERMINAL
    delete process.env.NEXT_PUBLIC_STOREFRONT_URL
  })
})

describe('payment orchestrator', () => {
  it('throws when method disabled', async () => {
    await expect(
      resolvePaymentNextStep({
        orderNumber: 'JW-X',
        orderId: 1,
        paymentMethodCode: 'apple_pay',
        amountEuros: 10,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodDisabledError)
  })
})
