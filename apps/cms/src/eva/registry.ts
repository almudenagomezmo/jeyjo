import { createLiveSkaiAdapter } from '@/eva/live-adapter'
import { createStubSkaiAdapter } from '@/eva/stub-adapter'
import type { SkaiAdapterKind, SkaiEvaAdapter } from '@/eva/types'

const SUPPORTED: SkaiAdapterKind[] = ['stub', 'live']

let cached: SkaiEvaAdapter | null = null

export function resolveSkaiAdapterKind(): SkaiAdapterKind {
  const raw = process.env.SKAI_ADAPTER?.trim().toLowerCase()

  if (!raw) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return 'stub'
    }
    throw new Error(
      'SKAI_ADAPTER is required in non-development environments (supported: stub, live)',
    )
  }

  if (!SUPPORTED.includes(raw as SkaiAdapterKind)) {
    throw new Error(`Unsupported SKAI_ADAPTER="${raw}" (supported: ${SUPPORTED.join(', ')})`)
  }

  return raw as SkaiAdapterKind
}

export function getSkaiAdapter(): SkaiEvaAdapter {
  if (cached) return cached

  const kind = resolveSkaiAdapterKind()
  cached = kind === 'live' ? createLiveSkaiAdapter() : createStubSkaiAdapter()
  return cached
}

export function resetSkaiAdapterCache(): void {
  cached = null
}
