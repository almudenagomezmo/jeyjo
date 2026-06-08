function cmsServerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3001')
  )
}

export function resolveCmsMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const base = cmsServerUrl().replace(/\/$/, '')
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

export function mediaUrlFromDoc(media: unknown): string | null {
  if (!media || typeof media !== 'object') return null
  const url = (media as { url?: string | null }).url
  return resolveCmsMediaUrl(url ?? null)
}
