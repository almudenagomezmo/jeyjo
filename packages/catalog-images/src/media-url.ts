import type { MediaLike } from './types.js'

export function mediaUrl(media: MediaLike): string | null {
  if (media == null) return null
  if (typeof media === 'number' || typeof media === 'string') return null
  const url = media.url?.trim()
  return url || null
}
