const METHODS = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'MasterCard' },
  { id: 'bizum', label: 'Bizum' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'apple-pay', label: 'Apple Pay' },
  { id: 'google-pay', label: 'Google Pay' },
] as const

export function PaymentMethodIcons() {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Métodos de pago aceptados">
      {METHODS.map((method) => (
        <li
          key={method.id}
          className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-neutral-400"
        >
          <span className="sr-only">{method.label}</span>
          <span aria-hidden="true">{method.label}</span>
        </li>
      ))}
    </ul>
  )
}
