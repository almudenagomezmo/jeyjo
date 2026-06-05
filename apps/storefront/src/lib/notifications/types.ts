export type NotificationChannel = 'email' | 'portal' | 'off'

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export type NotificationPreferences = {
  invoiceChannel: NotificationChannel
  orderChannel: NotificationChannel
  quoteChannel: NotificationChannel
  emailDisabledAt: string | null
}
