import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, POST } from '@/app/api/intranet/subusers/route'
import { PATCH } from '@/app/api/intranet/subusers/[id]/route'

const requireB2bSuperadmin = vi.fn()
const listCompanySubusers = vi.fn()
const createCompanySubuser = vi.fn()
const updateCompanySubuser = vi.fn()
const writeSubuserAudit = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bSuperadmin: () => requireB2bSuperadmin(),
  requireB2bApiSession: vi.fn(),
}))

vi.mock('@/lib/intranet/subusers', () => ({
  listCompanySubusers: (...args: unknown[]) => listCompanySubusers(...args),
  createCompanySubuser: (...args: unknown[]) => createCompanySubuser(...args),
  updateCompanySubuser: (...args: unknown[]) => updateCompanySubuser(...args),
}))

vi.mock('@/lib/auth/audit', () => ({
  writeSubuserAudit: (...args: unknown[]) => writeSubuserAudit(...args),
}))

describe('subusers API', () => {
  beforeEach(() => {
    requireB2bSuperadmin.mockReset()
    listCompanySubusers.mockReset()
    createCompanySubuser.mockReset()
    updateCompanySubuser.mockReset()
    writeSubuserAudit.mockReset()
  })

  it('GET returns 403 for non-superadmin', async () => {
    requireB2bSuperadmin.mockResolvedValue({
      error: Response.json({ error: 'Forbidden' }, { status: 403 }),
    })
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('POST creates subuser for superadmin', async () => {
    requireB2bSuperadmin.mockResolvedValue({
      ctx: { userId: 'admin', email: 'admin@empresa.com' },
      customerId: 'c1',
    })
    createCompanySubuser.mockResolvedValue({ id: 'sub-1' })

    const res = await POST(
      new Request('http://localhost/api/intranet/subusers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Compras',
          email: 'compras@empresa.com',
          password: 'password1',
          permissions: { finance: false, orders: true },
        }),
      }),
    )

    expect(res.status).toBe(201)
    expect(createCompanySubuser).toHaveBeenCalled()
    expect(writeSubuserAudit).toHaveBeenCalled()
  })

  it('PATCH deactivates subuser', async () => {
    requireB2bSuperadmin.mockResolvedValue({
      ctx: { userId: 'admin', email: 'admin@empresa.com' },
      customerId: 'c1',
    })
    updateCompanySubuser.mockResolvedValue({ ok: true })

    const res = await PATCH(
      new Request('http://localhost/api/intranet/subusers/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    )

    expect(res.status).toBe(200)
    expect(updateCompanySubuser).toHaveBeenCalledWith(
      expect.objectContaining({ subuserId: 'sub-1', isActive: false }),
    )
  })
})
