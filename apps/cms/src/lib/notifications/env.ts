export function isNotificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_ENABLED === 'true'
}

export function isWishlistStockAlertsEnabled(): boolean {
  return (
    isNotificationsEnabled() && process.env.WISHLIST_STOCK_ALERTS_ENABLED !== 'false'
  )
}
