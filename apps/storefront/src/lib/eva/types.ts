export type EvaContextChannel = 'storefront' | 'intranet'

export type EvaPageContext = {
  path: string
  productSku?: string
  productName?: string
}

export type SkaiFallbackContact = {
  phone?: string | null
  email?: string | null
  whatsapp?: string | null
  businessHours?: string | null
  outOfHoursMessage?: string | null
}

export type EvaBootstrapResponse = {
  enabled: boolean
  widgetId?: string
  scriptUrl?: string | null
  contextToken?: string
  fallback: SkaiFallbackContact
  unavailableMessage: string
}
