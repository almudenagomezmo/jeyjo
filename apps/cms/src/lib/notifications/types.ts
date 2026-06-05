export type NotificationType =
  | 'invoice_new'
  | 'order_status'
  | 'quote_status'
  | 'quote_expiring'
  | 'stock_available'

export type NotificationChannel = 'email' | 'portal' | 'off'

export type NotificationPayload = {
  href?: string
  orderNumber?: string
  quoteNumber?: string
  invoiceId?: string
  amount?: number
  currency?: string
  statusLabel?: string
  sku?: string
  productTitle?: string
  stockLabel?: string
  [key: string]: string | number | undefined
}

export type DispatchProfileNotificationInput = {
  webProfileId: string
  customerId: string
  type: NotificationType
  title: string
  body?: string
  payload?: NotificationPayload
  idempotencyKey: string
  emailTo?: string | null
}

export type DispatchNotificationInput = {
  customerId: string
  type: NotificationType
  title: string
  body?: string
  payload?: NotificationPayload
  idempotencyKey: string
  emailTo?: string | null
}
