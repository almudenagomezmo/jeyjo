import { describe, expect, it, afterEach, vi } from 'vitest'

import {
  getSkaiAdapter,
  resetSkaiAdapterCache,
  resolveSkaiAdapterKind,
} from '@/eva/registry'

describe('SKAI adapter registry', () => {
  afterEach(() => {
    resetSkaiAdapterCache()
    vi.unstubAllEnvs()
  })

  it('defaults to stub in development when SKAI_ADAPTER is unset', () => {
    vi.stubEnv('SKAI_ADAPTER', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(resolveSkaiAdapterKind()).toBe('stub')
    const adapter = getSkaiAdapter()
    expect(adapter.kind).toBe('stub')
    expect(adapter.getWidgetConfig()?.widgetId).toBeTruthy()
  })

  it('stub adapter returns fixture metrics', async () => {
    vi.stubEnv('SKAI_ADAPTER', 'stub')
    vi.stubEnv('NODE_ENV', 'development')
    const adapter = getSkaiAdapter()
    const metrics = await adapter.getConversationMetrics()
    expect(metrics.conversationsLast30Days).toBeGreaterThan(0)
    expect(metrics.unresolvedQueries.length).toBeGreaterThan(0)
  })

  it('throws for unknown SKAI_ADAPTER', () => {
    vi.stubEnv('SKAI_ADAPTER', 'azure')
    vi.stubEnv('NODE_ENV', 'development')
    expect(() => resolveSkaiAdapterKind()).toThrow(/Unsupported SKAI_ADAPTER/)
  })
})

describe('buildEvaPanel live flag', () => {
  it('marks stub adapter as not live', async () => {
    vi.stubEnv('SKAI_ADAPTER', 'stub')
    vi.stubEnv('NODE_ENV', 'development')
    resetSkaiAdapterCache()

    const { buildEvaPanel } = await import('@/lib/dashboard/eva-panel')
    const panel = await buildEvaPanel({
      find: async () => ({ docs: [] }),
    } as never)
    expect(panel.isLive).toBe(false)
    expect(panel.activeConversations).toBe(0)
  })
})
