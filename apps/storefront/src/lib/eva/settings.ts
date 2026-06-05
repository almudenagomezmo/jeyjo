import type { SkaiFallbackContact } from '@/lib/eva/types'
import type { SystemConfigDto } from '@/lib/system-config/types'

export type SkaiSettingsDoc = {
  enabled?: boolean
  businessHours?: string | null
  outOfHoursMessage?: string | null
  fallbackPhone?: string | null
  fallbackEmail?: string | null
  fallbackWhatsapp?: string | null
}

const DEFAULT_FALLBACK: SkaiFallbackContact = {
  phone: null,
  email: 'info@jeyjo.es',
  whatsapp: null,
  businessHours: 'Lunes a viernes 09:00–18:00',
  outOfHoursMessage:
    'EVA está disponible 24/7; el equipo humano atiende en horario laboral.',
}

let cached: { at: number; value: SkaiSettingsDoc } | null = null
const CACHE_MS = 60_000

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function fetchSkaiSettings(): Promise<SkaiSettingsDoc> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value
  }

  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) {
    return { enabled: true, ...DEFAULT_FALLBACK }
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/globals/skaiSettings`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      return { enabled: true, ...DEFAULT_FALLBACK }
    }
    const doc = (await res.json()) as SkaiSettingsDoc
    cached = { at: Date.now(), value: doc }
    return doc
  } catch {
    return { enabled: true, ...DEFAULT_FALLBACK }
  }
}

export function mapSkaiFallback(settings: SkaiSettingsDoc): SkaiFallbackContact {
  return {
    phone: settings.fallbackPhone ?? DEFAULT_FALLBACK.phone,
    email: settings.fallbackEmail ?? DEFAULT_FALLBACK.email,
    whatsapp: settings.fallbackWhatsapp ?? DEFAULT_FALLBACK.whatsapp,
    businessHours: settings.businessHours ?? DEFAULT_FALLBACK.businessHours,
    outOfHoursMessage: settings.outOfHoursMessage ?? DEFAULT_FALLBACK.outOfHoursMessage,
  }
}

export function mergeSkaiFallbackWithSystemContact(
  settings: SkaiSettingsDoc,
  systemContact: SystemConfigDto['contact'],
): SkaiFallbackContact {
  const skai = mapSkaiFallback(settings)
  return {
    ...skai,
    phone: settings.fallbackPhone?.trim() || systemContact.supportPhone || skai.phone,
    email: settings.fallbackEmail?.trim() || systemContact.supportEmail || skai.email,
    whatsapp: settings.fallbackWhatsapp?.trim() || systemContact.whatsapp || skai.whatsapp,
  }
}

export const EVA_UNAVAILABLE_MESSAGE =
  'El asistente no está disponible en este momento; puedes contactar con nosotros por teléfono o email'
