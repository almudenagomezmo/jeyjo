import { NextResponse } from 'next/server'

import { processRedsysNotification } from '@/lib/payments/redsys/process-notification'

const storefrontUrl = () => process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, '') ?? ''

/** Redsys POSTs signed parameters to UrlOK. */
export async function POST(request: Request) {
  const form = await request.formData()
  const merchantParameters = form.get('Ds_MerchantParameters')?.toString()
  const signature = form.get('Ds_Signature')?.toString()
  const base = storefrontUrl()

  if (!merchantParameters || !signature || !base) {
    return NextResponse.redirect(`${base}/checkout/retorno/ko?error=invalid`)
  }

  const result = await processRedsysNotification({ merchantParameters, signature })
  const order = result.orderNumber ?? ''
  if (!result.ok) {
    return NextResponse.redirect(
      `${base}/checkout/retorno/ko?order=${encodeURIComponent(order)}&error=signature`,
    )
  }

  return NextResponse.redirect(
    `${base}/checkout/confirmacion?order=${encodeURIComponent(order)}&paid=1`,
  )
}
