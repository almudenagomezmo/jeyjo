import type { FooterConfigDto } from '@/lib/footer/types'

export const DEFAULT_BUSINESS_HOURS = 'Lunes a viernes 09:00–18:00'

export const DEFAULT_FOOTER_CONFIG: FooterConfigDto = {
  businessHours: DEFAULT_BUSINESS_HOURS,
  resolvedContact: {
    phone: null,
    email: null,
    whatsapp: null,
  },
  showStores: true,
  showSocial: true,
  social: {
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
  },
  blog: {
    enabled: false,
    label: 'Blog',
  },
  euFunding: {
    enabled: false,
    imageUrl: null,
    alt: null,
    url: null,
  },
}
