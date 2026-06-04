export function isCheckoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED !== 'false'
}
