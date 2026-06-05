import { randomUUID } from 'node:crypto'

export function createNewsletterToken(): string {
  return randomUUID()
}

export function isConfirmTokenExpired(updatedAt: string, now = Date.now()): boolean {
  const updated = new Date(updatedAt).getTime()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return now - updated > sevenDaysMs
}
