export type NotificationType =
  | 'invoice_new'
  | 'order_status'
  | 'quote_status'
  | 'quote_expiring'

export type NotificationChannel = 'email' | 'portal' | 'off'

export type NotificationPayload = {
  href?: string
  orderNumber?: string
  quoteNumber?: string
  invoiceId?: string
  amount?: number
  currency?: string
  statusLabel?: string
  [key: string]: string | number | undefined
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
