export function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export function absoluteMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const base = cmsBaseUrl()
  if (!base) return trimmed
  return `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

export function absoluteMediaUrlOrNull(url: string | null): string | null {
  if (!url) return null
  return absoluteMediaUrl(url)
}
