export function isNotificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_ENABLED === 'true'
}
