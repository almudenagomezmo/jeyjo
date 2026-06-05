function cmsBaseUrl(): string | null {
  return process.env.CMS_URL ?? process.env.CMS_INTERNAL_URL ?? process.env.NEXT_PUBLIC_PAYLOAD_URL ?? null
}

function internalSecret(): string | null {
  return process.env.NEWSLETTER_INTERNAL_SECRET?.trim() ?? null
}

export async function cmsSendNewsletterConfirmation(subscriberId: string): Promise<boolean> {
  const base = cmsBaseUrl()
  const secret = internalSecret()
  if (!base || !secret) return false

  const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/newsletter/send-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-newsletter-internal-secret': secret,
    },
    body: JSON.stringify({ subscriberId }),
  })
  if (!res.ok) return false
  const data = (await res.json()) as { ok?: boolean }
  return data.ok === true
}

export async function cmsSyncNewsletterEsp(
  subscriberId: string,
  action: 'upsert' | 'remove',
): Promise<boolean> {
  const base = cmsBaseUrl()
  const secret = internalSecret()
  if (!base || !secret) return false

  const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/newsletter/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-newsletter-internal-secret': secret,
    },
    body: JSON.stringify({ subscriberId, action }),
  })
  return res.ok
}
