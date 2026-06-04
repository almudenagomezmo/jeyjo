import type { ReactNode } from 'react'

export interface TopBarMessage {
  id: string
  text: string
  /** Icon key resolved by TopBar — keeps config serializable. */
  icon: 'truck' | 'sparkles' | 'shield'
}

export const TOP_BAR_MESSAGES: readonly TopBarMessage[] = [
  { id: 'shipping', icon: 'truck', text: 'Envío gratis a partir de 39 € · 24-48 h' },
  { id: 'eva', icon: 'sparkles', text: 'Asistente EVA: dudas y pedidos 24/7' },
  { id: 'payment', icon: 'shield', text: 'Pago seguro · Redsys, Bizum, PayPal' },
] as const

export type TopBarMessageIcon = TopBarMessage['icon']

export type TopBarMessageWithIcon = TopBarMessage & { iconNode: ReactNode }
