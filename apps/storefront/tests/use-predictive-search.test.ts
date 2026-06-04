/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { usePredictiveSearch } from '@/lib/hooks/usePredictiveSearch'

describe('usePredictiveSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('aborts stale fetch when query changes after debounce', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(() => {
            /* in-flight */
          }),
      ),
    )

    const { rerender } = renderHook(({ q }: { q: string }) => usePredictiveSearch(q), {
      initialProps: { q: 'bol' },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    rerender({ q: 'boli' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    expect(abortSpy).toHaveBeenCalled()
  })
})
