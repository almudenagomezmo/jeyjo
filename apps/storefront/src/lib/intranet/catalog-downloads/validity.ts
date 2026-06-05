const MADRID_TZ = 'Europe/Madrid'

export function todayInMadrid(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: MADRID_TZ })
}

export function toDateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 10)
}

export function isCatalogDownloadActive(
  validFrom: string | Date | null | undefined,
  validUntil: string | Date | null | undefined,
  today: string = todayInMadrid(),
): boolean {
  const from = toDateKey(validFrom)
  const until = toDateKey(validUntil)
  if (!from || !until) return false
  return from <= today && until >= today
}

export function matchesCustomerGroup(
  customerGroups: string[] | null | undefined,
  group: number,
): boolean {
  if (!customerGroups?.length) return true
  return customerGroups.includes(String(group))
}
