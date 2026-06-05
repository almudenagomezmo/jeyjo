import type { NotificationChannel, NotificationType } from './types'

export function channelFieldForType(
  type: NotificationType,
): 'invoice_channel' | 'order_channel' | 'quote_channel' {
  switch (type) {
    case 'invoice_new':
      return 'invoice_channel'
    case 'order_status':
      return 'order_channel'
    case 'quote_status':
    case 'quote_expiring':
      return 'quote_channel'
  }
}

export function allowsPortal(channel: NotificationChannel): boolean {
  return channel === 'email' || channel === 'portal'
}

export function allowsEmail(channel: NotificationChannel, emailDisabled: boolean): boolean {
  if (emailDisabled) return false
  return channel === 'email'
}
