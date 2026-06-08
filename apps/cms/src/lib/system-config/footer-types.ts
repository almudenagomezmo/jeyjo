export type FooterConfigDto = {
  businessHours: string
  resolvedContact: {
    phone: string | null
    email: string | null
    whatsapp: string | null
  }
  showStores: boolean
  showSocial: boolean
  social: {
    facebook: string | null
    instagram: string | null
    linkedin: string | null
    youtube: string | null
  }
  blog: {
    enabled: boolean
    label: string
  }
  euFunding: {
    enabled: boolean
    imageUrl: string | null
    alt: string | null
    url: string | null
  }
}

export type FooterSettingsDoc = {
  showStores?: boolean | null
  showSocial?: boolean | null
  socialFacebook?: string | null
  socialInstagram?: string | null
  socialLinkedin?: string | null
  socialYoutube?: string | null
  blogEnabled?: boolean | null
  blogLabel?: string | null
  euFundingEnabled?: boolean | null
  euFundingImage?: { url?: string | null; id?: number | string } | number | null
  euFundingAlt?: string | null
  euFundingUrl?: string | null
}

export type SkaiSettingsContactDoc = {
  businessHours?: string | null
  fallbackPhone?: string | null
  fallbackEmail?: string | null
  fallbackWhatsapp?: string | null
}
