export function isQuickOrderEnabled(): boolean {
  return process.env.QUICK_ORDER_ENABLED !== 'false'
}
