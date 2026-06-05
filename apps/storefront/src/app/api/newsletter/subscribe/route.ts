import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { cmsSendNewsletterConfirmation } from '@/lib/newsletter/cms-internal'
import {
  buildRateLimitKey,
  isNewsletterRateLimited,
  recordNewsletterRateHit,
} from '@/lib/newsletter/rate-limit'
import { isValidNewsletterEmail, normalizeNewsletterEmail, upsertPendingSubscriber } from '@/lib/newsletter/repository'
import { getNewsletterSettings } from '@/lib/newsletter/settings'
import type { NewsletterSource } from '@/lib/newsletter/types'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const GENERIC_SUCCESS = {
  message: 'Si el correo es válido, recibirás un email para confirmar la suscripción.',
}

export async function POST(request: Request) {
  const settings = await getNewsletterSettings()
  if (!settings.enabled) {
    return NextResponse.json({ error: 'Suscripciones temporalmente no disponibles' }, { status: 503 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  let body: { email?: string; consent?: boolean; source?: NewsletterSource }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim()
  if (!isValidNewsletterEmail(email)) {
    return NextResponse.json({ error: 'Introduce un email válido' }, { status: 400 })
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: 'Debes aceptar recibir comunicaciones comerciales' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const bucketKey = buildRateLimitKey(ip, normalizeNewsletterEmail(email))
  if (await isNewsletterRateLimited(supabase, bucketKey)) {
    return NextResponse.json({ error: 'Demasiados intentos. Prueba más tarde.' }, { status: 429 })
  }

  await recordNewsletterRateHit(supabase, bucketKey)

  const ctx = await getCustomerContext()
  const source: NewsletterSource = body.source === 'account' ? 'account' : 'footer'

  const { row, createdOrReset } = await upsertPendingSubscriber(supabase, {
    email,
    source,
    webProfileId: ctx?.userId ?? null,
  })

  if (createdOrReset) {
    await cmsSendNewsletterConfirmation(row.id)
  }

  return NextResponse.json(GENERIC_SUCCESS)
}
