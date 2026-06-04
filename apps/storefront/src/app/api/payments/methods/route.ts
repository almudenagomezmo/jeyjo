import { NextResponse } from 'next/server'

import {
  fetchPaymentSettings,
  listEnabledPaymentMethods,
} from '@/lib/payments/settings'

const LABELS: Record<string, string> = {
  card: 'Tarjeta',
  bizum: 'Bizum',
  paypal: 'PayPal',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  transfer: 'Transferencia bancaria',
}

export async function GET() {
  const settings = await fetchPaymentSettings()
  const codes = listEnabledPaymentMethods(settings)
  const methods = codes.map((code) => ({
    code,
    label: LABELS[code] ?? code,
  }))

  return NextResponse.json(
    { methods, transferInstructions: settings.transferInstructions },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  )
}
