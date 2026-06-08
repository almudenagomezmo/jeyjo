import { afterEach, describe, expect, it, vi } from 'vitest'

import * as customerContext from '@/lib/auth/customer-context'
import * as adminModule from '@/lib/supabase/admin'

const { PATCH } = await import('@/app/api/account/profile/route')

describe('PATCH /api/account/profile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when not logged in', async () => {
    vi.spyOn(customerContext, 'getCustomerContext').mockResolvedValue(null)
    const res = await PATCH(
      new Request('http://local/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'Ana García' }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it('returns 422 for short display name', async () => {
    vi.spyOn(customerContext, 'getCustomerContext').mockResolvedValue({
      userId: 'user-1',
      customerId: 'cust-1',
      email: 'a@test.com',
      displayName: null,
    } as never)
    const res = await PATCH(
      new Request('http://local/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'A' }),
      }),
    )
    expect(res.status).toBe(422)
  })

  it('updates display_name via admin client', async () => {
    vi.spyOn(customerContext, 'getCustomerContext').mockResolvedValue({
      userId: 'user-1',
      customerId: 'cust-1',
      email: 'a@test.com',
      displayName: null,
    } as never)

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { display_name: 'Ana García' },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    vi.spyOn(adminModule, 'getSupabaseAdminClient').mockReturnValue({
      from: vi.fn().mockReturnValue({ update }),
    } as never)

    const res = await PATCH(
      new Request('http://local/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'Ana García' }),
      }),
    )

    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith({ display_name: 'Ana García' })
    const json = (await res.json()) as { displayName?: string }
    expect(json.displayName).toBe('Ana García')
  })
})
