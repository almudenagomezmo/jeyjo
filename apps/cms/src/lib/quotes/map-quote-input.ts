export type QuoteLineSnapshot = {
  lineId: string
  skuErp: string
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export type StorefrontQuoteCreateInput = {
  segment: 'b2c' | 'b2b'
  customerRef: string | null
  guestEmail: string | null
  deliveryMethod: string
  pickupStoreLabel: string | null
  shippingAddressSnapshot: Record<string, unknown> | null
  billingAddressSnapshot: Record<string, unknown> | null
  customerNotes: string | null
  subtotal: number
  shippingCost: number
  amount: number
  lineSnapshots: QuoteLineSnapshot[]
}

export type QuoteToOrderInput = {
  quoteNumber: string
  segment: 'b2c' | 'b2b'
  customerRef: string | null
  guestEmail: string | null
  deliveryMethod: string | null
  pickupStoreLabel: string | null
  shippingAddressSnapshot: Record<string, unknown> | null
  billingAddressSnapshot: Record<string, unknown> | null
  customerNotes: string | null
  shippingCost: number | null
  amount: number | null
  lineSnapshots: QuoteLineSnapshot[] | null
}

export function parseQuoteLineSnapshots(raw: unknown): QuoteLineSnapshot[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (line): line is QuoteLineSnapshot =>
      Boolean(line) &&
      typeof line === 'object' &&
      typeof (line as QuoteLineSnapshot).skuErp === 'string' &&
      typeof (line as QuoteLineSnapshot).qty === 'number',
  )
}

export function mapQuoteToOrderCreateData(input: QuoteToOrderInput): Record<string, unknown> {
  const jeyjoStatus = input.segment === 'b2b' ? 'pending_confirmation' : 'pending_payment'

  return {
    origin: input.segment,
    jeyjoStatus,
    customerRef: input.customerRef,
    guestEmail: input.guestEmail,
    deliveryMethod: input.deliveryMethod,
    shippingCost: input.shippingCost ?? 0,
    pickupStoreLabel: input.pickupStoreLabel,
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    billingAddressSnapshot: input.billingAddressSnapshot,
    customerNotes: input.customerNotes,
    amount: input.amount,
    orderLineSnapshots: input.lineSnapshots ?? [],
    items: [],
    paymentStatus: input.segment === 'b2b' ? undefined : 'pending',
    paymentMethodCode: input.segment === 'b2b' ? 'erp_default' : 'transfer',
    paymentMethodLabel:
      input.segment === 'b2b' ? 'Condiciones acordadas' : 'Pendiente de pago (desde presupuesto)',
    gateway: input.segment === 'b2b' ? 'erp' : 'transfer',
  }
}

export function mapStorefrontInputToQuoteData(
  input: StorefrontQuoteCreateInput,
): Record<string, unknown> {
  return {
    status: 'requested',
    segment: input.segment,
    customerRef: input.customerRef,
    guestEmail: input.guestEmail,
    deliveryMethod: input.deliveryMethod,
    pickupStoreLabel: input.pickupStoreLabel,
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    billingAddressSnapshot: input.billingAddressSnapshot,
    customerNotes: input.customerNotes,
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    amount: input.amount,
    lineSnapshots: input.lineSnapshots,
  }
}
