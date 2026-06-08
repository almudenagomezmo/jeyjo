import { describe, expect, it } from 'vitest'

import {
  buildCompareUrl,
  parseCompareSkusParam,
} from '@/lib/compare/parse-compare-skus'

describe('parseCompareSkusParam', () => {
  it('parses CSV preserving order and deduping', () => {
    expect(parseCompareSkusParam('B,A,B,C')).toEqual(['B', 'A', 'C'])
  })

  it('parses repeated params', () => {
    expect(parseCompareSkusParam(['A', 'B,C'])).toEqual(['A', 'B', 'C'])
  })

  it('limits to three skus', () => {
    expect(parseCompareSkusParam('A,B,C,D')).toEqual(['A', 'B', 'C'])
  })
})

describe('buildCompareUrl', () => {
  it('round-trips sku order in query string', () => {
    const skus = ['REF-002', 'REF-001']
    const url = buildCompareUrl(skus)
    expect(url).toBe('/comparar?skus=REF-002%2CREF-001')
    expect(parseCompareSkusParam(new URL(url, 'http://test').searchParams.get('skus')!)).toEqual(
      skus,
    )
  })
})
