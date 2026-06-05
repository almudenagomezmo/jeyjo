import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('searchEventHooks dev on-save trigger', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not enable post-save indexer in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SEARCH_INDEX_ON_SAVE', 'true')
    const { isSearchIndexOnSaveEnabled } = await import('@/search-indexer/config')
    expect(isSearchIndexOnSaveEnabled()).toBe(false)
  })

  it('enables post-save indexer in development when flag set', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('SEARCH_INDEX_ON_SAVE', 'true')
    const { isSearchIndexOnSaveEnabled } = await import('@/search-indexer/config')
    expect(isSearchIndexOnSaveEnabled()).toBe(true)
  })
})
