import type { Payload, PayloadRequest } from 'payload'

import { loadSystemSettingsDoc } from '@/lib/system-config/resolve'

/** Env fallback when CMS global is unavailable (default: web-native on). */
export function isWebNativeModeFromEnv(): boolean {
  const raw = process.env.WEB_NATIVE_MODE?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  if (raw === 'true' || raw === '1' || raw === 'yes') return true
  return true
}

export function isWebNativeModeFromReq(req: PayloadRequest): boolean {
  if (req.context?.webNativeMode === false) return false
  if (req.context?.webNativeMode === true) return true
  return isWebNativeModeFromEnv()
}

export async function isWebNativeMode(payload?: Payload): Promise<boolean> {
  if (!payload) return isWebNativeModeFromEnv()
  const doc = await loadSystemSettingsDoc(payload)
  if (doc?.webNativeMode === false) return false
  if (doc?.webNativeMode === true) return true
  return isWebNativeModeFromEnv()
}

export function webNativeDisabledBody(): { error: string; code: 'WEB_NATIVE_MODE' } {
  return {
    error: 'Operación deshabilitada en modo web-native (sin integración ERP).',
    code: 'WEB_NATIVE_MODE',
  }
}

export function webNativeDisabledResponse(): Response {
  return Response.json(webNativeDisabledBody(), { status: 410 })
}
