import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_FOOTER_CONFIG,
} from '@/lib/system-config/footer-defaults'
import type {
  FooterConfigDto,
  FooterSettingsDoc,
  SkaiSettingsContactDoc,
} from '@/lib/system-config/footer-types'
import type { SystemSettingsDoc } from '@/lib/system-config/types'

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resolveMediaUrl(
  value: FooterSettingsDoc['euFundingImage'],
  serverUrl: string,
): string | null {
  if (!value || typeof value !== 'object') return null
  const url = 'url' in value ? optionalString(value.url) : null
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${serverUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

export function resolveBusinessHours(skai?: SkaiSettingsContactDoc | null): string {
  return optionalString(skai?.businessHours) ?? DEFAULT_BUSINESS_HOURS
}

export function resolvePublicContact(
  system: SystemSettingsDoc | null | undefined,
  skai?: SkaiSettingsContactDoc | null,
): FooterConfigDto['resolvedContact'] {
  const systemPhone = optionalString(system?.supportPhone)
  const systemEmail = optionalString(system?.supportEmail)
  const systemWhatsapp = optionalString(system?.whatsapp)

  return {
    phone: optionalString(skai?.fallbackPhone) ?? systemPhone,
    email: optionalString(skai?.fallbackEmail) ?? systemEmail,
    whatsapp: optionalString(skai?.fallbackWhatsapp) ?? systemWhatsapp,
  }
}

export function mapFooterSettingsToDto(
  footer: FooterSettingsDoc | null | undefined,
  system: SystemSettingsDoc | null | undefined,
  skai: SkaiSettingsContactDoc | null | undefined,
  serverUrl: string,
): FooterConfigDto {
  const base = DEFAULT_FOOTER_CONFIG

  if (!footer) {
    return {
      ...base,
      businessHours: resolveBusinessHours(skai),
      resolvedContact: resolvePublicContact(system, skai),
    }
  }

  const euEnabled = footer.euFundingEnabled === true
  const imageUrl = euEnabled ? resolveMediaUrl(footer.euFundingImage, serverUrl) : null

  return {
    businessHours: resolveBusinessHours(skai),
    resolvedContact: resolvePublicContact(system, skai),
    showStores: footer.showStores !== false,
    showSocial: footer.showSocial !== false,
    social: {
      facebook: optionalString(footer.socialFacebook),
      instagram: optionalString(footer.socialInstagram),
      linkedin: optionalString(footer.socialLinkedin),
      youtube: optionalString(footer.socialYoutube),
    },
    blog: {
      enabled: footer.blogEnabled === true,
      label: optionalString(footer.blogLabel) ?? base.blog.label,
    },
    euFunding: {
      enabled: euEnabled && Boolean(imageUrl),
      imageUrl,
      alt: euEnabled ? optionalString(footer.euFundingAlt) : null,
      url: euEnabled ? optionalString(footer.euFundingUrl) : null,
    },
  }
}
