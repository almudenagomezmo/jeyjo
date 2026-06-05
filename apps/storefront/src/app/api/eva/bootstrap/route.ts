import { NextResponse } from 'next/server'

import { signEvaContextToken } from '@/lib/eva/jwt'
import { isEvaRateLimited } from '@/lib/eva/rate-limit'
import {
  EVA_UNAVAILABLE_MESSAGE,
  fetchSkaiSettings,
  mergeSkaiFallbackWithSystemContact,
} from '@/lib/eva/settings'
import { getContactConfig } from '@/lib/system-config/fetch'
import type { EvaContextChannel, EvaPageContext } from '@/lib/eva/types'
import { getCustomerContext } from '@/lib/auth/customer-context'

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function parsePageContext(request: Request): EvaPageContext {
  const url = new URL(request.url)
  const path = url.searchParams.get('path')?.trim() || '/'
  const productSku = url.searchParams.get('productSku')?.trim() || undefined
  const productName = url.searchParams.get('productName')?.trim() || undefined
  return { path, productSku, productName }
}

function isWidgetGloballyEnabled(): boolean {
  const flag = process.env.EVA_WIDGET_ENABLED?.trim().toLowerCase()
  if (flag === 'false' || flag === '0') return false
  return true
}

export async function GET(request: Request) {
  const ip = clientIp(request)
  if (isEvaRateLimited(`eva-bootstrap:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!isWidgetGloballyEnabled()) {
    const contact = await getContactConfig()
    return NextResponse.json({
      enabled: false,
      fallback: mergeSkaiFallbackWithSystemContact({}, contact),
      unavailableMessage: EVA_UNAVAILABLE_MESSAGE,
    })
  }

  try {
    const [settings, contact] = await Promise.all([fetchSkaiSettings(), getContactConfig()])
    const fallback = mergeSkaiFallbackWithSystemContact(settings, contact)

    if (settings.enabled === false) {
      return NextResponse.json({
        enabled: false,
        fallback,
        unavailableMessage: EVA_UNAVAILABLE_MESSAGE,
      })
    }

    const channel = (new URL(request.url).searchParams.get('channel') ??
      'storefront') as EvaContextChannel
    const page = parsePageContext(request)
    const ctx = await getCustomerContext()
    const sub = ctx?.customerId ?? 'anonymous'

    const contextToken = signEvaContextToken({
      sub,
      channel: channel === 'intranet' ? 'intranet' : 'storefront',
      page,
    })

    const widgetId = process.env.SKAI_WIDGET_ID?.trim() || 'eva-stub-widget'
    const scriptUrl = process.env.SKAI_WIDGET_SCRIPT_URL?.trim() || null

    return NextResponse.json({
      enabled: true,
      widgetId,
      scriptUrl,
      contextToken,
      fallback,
      unavailableMessage: EVA_UNAVAILABLE_MESSAGE,
    })
  } catch {
    return NextResponse.json(
      {
        enabled: false,
        fallback: mapSkaiFallback({}),
        unavailableMessage: EVA_UNAVAILABLE_MESSAGE,
      },
      { status: 500 },
    )
  }
}
