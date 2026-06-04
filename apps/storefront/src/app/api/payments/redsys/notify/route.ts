import { NextResponse } from 'next/server'

import { processRedsysNotification } from '@/lib/payments/redsys/process-notification'

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const merchantParameters =
    form?.get('Ds_MerchantParameters')?.toString() ??
    new URL(request.url).searchParams.get('Ds_MerchantParameters')
  const signature =
    form?.get('Ds_Signature')?.toString() ??
    new URL(request.url).searchParams.get('Ds_Signature')

  if (!merchantParameters || !signature) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const result = await processRedsysNotification({ merchantParameters, signature })
    if (!result.ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('[redsys/notify]', err)
    return new NextResponse('OK', { status: 200 })
  }
}
