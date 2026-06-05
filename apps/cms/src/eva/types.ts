export type SkaiAdapterKind = 'stub' | 'live'

export type SkaiWidgetConfig = {
  widgetId: string
  scriptUrl: string | null
}

export type SkaiUnresolvedQuery = {
  id: string
  label: string
}

export type SkaiMetrics = {
  activeConversations: number
  conversationsLast30Days: number
  unresolvedQueries: SkaiUnresolvedQuery[]
}

export type SkaiHealth = {
  ok: boolean
  message?: string
}

export type SkaiKnowledgeMeta = {
  filename: string
  mimeType: string
}

export type SkaiEvaAdapter = {
  kind: SkaiAdapterKind
  getWidgetConfig(): SkaiWidgetConfig | null
  getConversationMetrics(): Promise<SkaiMetrics>
  uploadKnowledgeDocument(file: Buffer, meta: SkaiKnowledgeMeta): Promise<void>
  validateConnection(): Promise<SkaiHealth>
}

export type EvaContextChannel = 'storefront' | 'intranet'

export type EvaPageContext = {
  path: string
  productSku?: string
  productName?: string
}

export type EvaContextClaims = {
  sub: string | 'anonymous'
  channel: EvaContextChannel
  page: EvaPageContext
  iat?: number
  exp?: number
}

export type EvaAnonymousContext = {
  kind: 'anonymous'
  page: EvaPageContext
  shippingPolicy: string
  product?: {
    sku: string
    name: string
    publicPrice?: number | null
  } | null
}

export type EvaAuthenticatedContext = {
  kind: 'authenticated'
  customerId: string
  commercialName: string
  page: EvaPageContext
  recentOrders: Array<{
    orderNumber: string | null
    createdAt: string
    total: number | null
    status: string | null
  }>
  purchaseHistory: Array<{
    sku: string
    quantity: number
    purchasedAt: string
  }>
}

export type EvaContextPayload = EvaAnonymousContext | EvaAuthenticatedContext

export type SkaiOrderLineInput = {
  skuErp: string
  name: string
  qty: number
  unitPrice: number
}

export type SkaiOrderPayload = {
  skaiExternalId: string
  customerRef?: string | null
  guestEmail?: string | null
  customerNotes?: string | null
  lines: SkaiOrderLineInput[]
}

export type SkaiFallbackContact = {
  phone?: string | null
  email?: string | null
  whatsapp?: string | null
  businessHours?: string | null
  outOfHoursMessage?: string | null
}
