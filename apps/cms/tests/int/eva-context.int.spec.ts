import { describe, expect, it, vi, beforeEach } from 'vitest'

import { signEvaContextToken, verifyEvaContextToken } from '@/eva/jwt'
import { resolveEvaContext } from '@/eva/resolve-context'

const customerRows: Record<string, { commercial_name: string; erp_code: string | null }> = {
  'cust-a': { commercial_name: 'Empresa A', erp_code: 'B2B-EMPRESA1' },
  'cust-b': { commercial_name: 'Empresa B', erp_code: 'B2B-EMPRESA2' },
}

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: (table: string) => {
      if (table !== 'customers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            maybeSingle: async () => ({
              data: customerRows[id] ?? null,
            }),
          }),
        }),
      }
    },
  }),
}))

const payloadMock = {
  find: vi.fn(async ({ collection, where }: { collection: string; where?: unknown }) => {
    if (collection === 'products') {
      return { docs: [{ title: 'Bolígrafo', priceInEUR: 1.2 }] }
    }
    if (collection === 'orders') {
      const customerRef = (where as { customerRef?: { equals: string } })?.customerRef?.equals
      if (customerRef === 'cust-a') {
        return {
          docs: [
            {
              orderNumber: 'WEB-A-1',
              createdAt: '2026-06-01T10:00:00Z',
              amount: 50,
              jeyjoStatus: 'confirmed',
            },
          ],
        }
      }
      if (customerRef === 'cust-b') {
        return {
          docs: [
            {
              orderNumber: 'WEB-B-9',
              createdAt: '2026-06-02T10:00:00Z',
              amount: 99,
              jeyjoStatus: 'confirmed',
            },
          ],
        }
      }
    }
    return { docs: [] }
  }),
} as never

describe('EVA context resolution', () => {
  beforeEach(() => {
    vi.stubEnv('EVA_CONTEXT_JWT_SECRET', 'test-secret')
  })

  it('anonymous token resolves without customer id', async () => {
    const token = signEvaContextToken({
      sub: 'anonymous',
      channel: 'storefront',
      page: { path: '/', productSku: 'REF-001' },
    })
    const claims = verifyEvaContextToken(token)
    const ctx = await resolveEvaContext(payloadMock, claims)
    expect(ctx.kind).toBe('anonymous')
    if (ctx.kind === 'anonymous') {
      expect(ctx.product?.sku).toBe('REF-001')
    }
  })

  it('authenticated contexts do not cross-leak between customers', async () => {
    const tokenA = signEvaContextToken({
      sub: 'cust-a',
      channel: 'intranet',
      page: { path: '/intranet' },
    })
    const tokenB = signEvaContextToken({
      sub: 'cust-b',
      channel: 'intranet',
      page: { path: '/intranet' },
    })

    const ctxA = await resolveEvaContext(payloadMock, verifyEvaContextToken(tokenA))
    const ctxB = await resolveEvaContext(payloadMock, verifyEvaContextToken(tokenB))

    expect(ctxA.kind).toBe('authenticated')
    expect(ctxB.kind).toBe('authenticated')
    if (ctxA.kind === 'authenticated' && ctxB.kind === 'authenticated') {
      expect(ctxA.customerId).toBe('cust-a')
      expect(ctxB.customerId).toBe('cust-b')
      expect(ctxA.recentOrders[0]?.orderNumber).toBe('WEB-A-1')
      expect(ctxB.recentOrders[0]?.orderNumber).toBe('WEB-B-9')
      expect(ctxA.recentOrders[0]?.orderNumber).not.toBe(ctxB.recentOrders[0]?.orderNumber)
    }
  })
})
