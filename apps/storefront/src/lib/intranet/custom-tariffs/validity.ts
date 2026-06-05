import type { TariffValidityStatus } from './types'

const MADRID_TZ = 'Europe/Madrid'

export function todayInMadrid(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: MADRID_TZ })
}

export function resolveTariffValidity(validTo: string | null | undefined): {
  status: TariffValidityStatus
  statusLabel: 'Vigente' | 'Caducado'
} {
  if (!validTo?.trim()) {
    return { status: 'active', statusLabel: 'Vigente' }
  }
  const today = todayInMadrid()
  if (validTo.trim() < today) {
    return { status: 'expired', statusLabel: 'Caducado' }
  }
  return { status: 'active', statusLabel: 'Vigente' }
}
