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

export type PublicContact = FooterConfigDto['resolvedContact'] & {
  businessHours: string
}
