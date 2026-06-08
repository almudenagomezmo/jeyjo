import type { SystemConfigDto } from '@/lib/system-config/types'

import type { PublicContact } from './types'

export function resolvePublicContact(config: SystemConfigDto): PublicContact {
  return {
    ...config.footer.resolvedContact,
    businessHours: config.footer.businessHours,
  }
}

export function whatsappHref(number: string): string {
  const digits = number.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : '#'
}

export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : '#'
}
