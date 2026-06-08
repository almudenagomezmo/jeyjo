import { describe, expect, it, vi } from 'vitest'

import { buildCustomerApprovalEmail } from '@/lib/customers/emails/approval'
import { validateReclassifyInput } from '@/lib/customers/reclassify-validation'
import { canManageCustomers } from '@/access/customerValidation'
import { roleForCustomerGroup } from '@/lib/customers/group-labels'
import { parseListCustomersQuery } from '@/lib/customers/repository'
import { buildSystemAlerts } from '@/lib/dashboard/alerts'

const fetchCustomerDetailMock = vi.fn()

vi.mock('@/lib/customers/fetch-customer-detail', () => ({
  fetchCustomerDetail: (...args: unknown[]) => fetchCustomerDetailMock(...args),
}))

vi.mock('@/lib/supabase-server', () => ({
  writeAuditLog: vi.fn(),
}))

vi.mock('@/lib/customers/emails/approval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/customers/emails/approval')>()
  return {
    ...actual,
    sendCustomerApprovalEmail: vi.fn(async () => true),
  }
})

describe('customers-admin query parsing', () => {
  it('defaults to pending status', () => {
    const q = parseListCustomersQuery('http://localhost/api/customers-admin')
    expect(q.status).toBe('pending')
    expect(q.page).toBe(1)
    expect(q.limit).toBe(25)
  })

  it('parses validated filter and group', () => {
    const q = parseListCustomersQuery(
      'http://localhost/api/customers-admin?status=validated&group=3&search=colegio&page=2&limit=10',
    )
    expect(q.status).toBe('validated')
    expect(q.group).toBe(3)
    expect(q.search).toBe('colegio')
    expect(q.page).toBe(2)
    expect(q.limit).toBe(10)
  })
})

describe('customer approval email', () => {
  it('links B2C to cuenta', () => {
    const { subject, html, portalPath } = buildCustomerApprovalEmail({
      to: 'a@b.com',
      commercialName: 'Ana',
      customerGroup: 1,
      taxId: null,
    })
    expect(subject).toContain('validada')
    expect(portalPath).toBe('/cuenta')
    expect(html).toContain('/cuenta')
    expect(html).not.toContain('/intranet')
  })

  it('links B2B groups 2–4 to cuenta', () => {
    for (const group of [2, 3, 4] as const) {
      const { portalPath, html } = buildCustomerApprovalEmail({
        to: 'b@b.com',
        commercialName: 'Empresa',
        customerGroup: group,
        taxId: 'B12345678',
      })
      expect(portalPath).toBe('/cuenta')
      expect(html).toContain('/cuenta')
      expect(html).toContain('B12345678')
    }
  })

  it('maps groups 3 and 4 to b2b_superadmin role', () => {
    expect(roleForCustomerGroup(3)).toBe('b2b_superadmin')
    expect(roleForCustomerGroup(4)).toBe('b2b_superadmin')
  })
})

describe('validate customer email gate', () => {
  it('rejects validation when email is not confirmed', async () => {
    fetchCustomerDetailMock.mockResolvedValueOnce({
      customer: {
        id: 'c1',
        commercial_name: 'Test',
        email: 't@t.com',
        customer_group: 1,
        validated_at: null,
        tax_id: null,
        is_company: false,
      },
      profiles: [],
      canValidate: true,
      canReclassify: false,
      emailConfirmedForValidation: false,
    })

    const { validateCustomer } = await import('@/lib/customers/validate-customer')
    const result = await validateCustomer({
      payload: { sendEmail: vi.fn(), logger: { error: vi.fn() } } as never,
      supabase: {} as never,
      customerId: 'c1',
      customerGroup: 2,
      actorId: 1,
      actorName: 'admin@test.com',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(422)
      expect(result.message).toMatch(/email/i)
    }
  })
})

describe('customer management access', () => {
  it('allows superadmin and administracion', () => {
    expect(canManageCustomers({ staffRoles: ['superadmin'] })).toBe(true)
    expect(canManageCustomers({ staffRoles: ['administracion'] })).toBe(true)
    expect(canManageCustomers({ staffRoles: ['catalogo'] })).toBe(false)
  })
})

describe('reclassify validation', () => {
  const titular = {
    id: 'p1',
    email: 'admin@empresa.com',
    role: 'b2c',
    is_active: true,
    last_login_at: null,
    display_name: null,
    email_confirmed: true,
  }

  it('rejects pending customers', () => {
    const result = validateReclassifyInput({
      customerGroup: 2,
      profileRoles: [{ profileId: 'p1', role: 'b2b_superadmin' }],
      profiles: [titular],
      validatedAt: null,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(409)
  })

  it('allows B2C to B2B upgrade', () => {
    const result = validateReclassifyInput({
      customerGroup: 2,
      profileRoles: [{ profileId: 'p1', role: 'b2b_superadmin' }],
      profiles: [titular],
      validatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(true)
  })

  it('blocks B2B downgrade with active subusers', () => {
    const result = validateReclassifyInput({
      customerGroup: 1,
      profileRoles: [
        { profileId: 'p1', role: 'b2c' },
        { profileId: 'p2', role: 'b2c' },
      ],
      profiles: [
        titular,
        {
          id: 'p2',
          email: 'sub@empresa.com',
          role: 'b2b_subuser',
          is_active: true,
          last_login_at: null,
          display_name: null,
          email_confirmed: true,
        },
      ],
      validatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(409)
  })

  it('rejects titular b2c role on B2B group', () => {
    const result = validateReclassifyInput({
      customerGroup: 2,
      profileRoles: [{ profileId: 'p1', role: 'b2c' }],
      profiles: [titular],
      validatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(400)
  })

  it('allows group-only reclassify when there are no web profiles', () => {
    const result = validateReclassifyInput({
      customerGroup: 3,
      profileRoles: [],
      profiles: [],
      validatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.assignments).toEqual([])
  })
})

describe('reclassify customer service', () => {
  it('persists group and role updates', async () => {
    fetchCustomerDetailMock.mockResolvedValueOnce({
      customer: {
        id: 'c1',
        commercial_name: 'Empresa',
        email: 'e@e.com',
        customer_group: 1,
        validated_at: '2026-01-01T00:00:00.000Z',
        tax_id: null,
        is_company: true,
      },
      profiles: [
        {
          id: 'p1',
          email: 'e@e.com',
          role: 'b2c',
          is_active: true,
          last_login_at: null,
          display_name: null,
          email_confirmed: true,
        },
      ],
      canValidate: false,
      canReclassify: true,
      emailConfirmedForValidation: true,
    })

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'customers') {
          return { update: vi.fn(() => ({ eq: updateEq })) }
        }
        if (table === 'web_profiles') {
          return { update: vi.fn(() => ({ eq: updateEq })) }
        }
        return {}
      }),
    } as never

    const { reclassifyCustomer } = await import('@/lib/customers/reclassify-customer')
    const result = await reclassifyCustomer({
      supabase,
      customerId: 'c1',
      customerGroup: 2,
      profileRoles: [{ profileId: 'p1', role: 'b2b_superadmin' }],
      actorId: 1,
      actorName: 'admin@test.com',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.customerGroup).toBe(2)
      expect(result.profiles[0]?.role).toBe('b2b_superadmin')
    }
  })
})

describe('dashboard pending customers alert', () => {
  it('links to customers admin pending filter', async () => {
    const emptyErpChain = {
      gte: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'customers') {
          return {
            select: vi.fn(() => ({
              is: vi.fn().mockResolvedValue({ count: 2, error: null }),
            })),
          }
        }
        if (table === 'erp_sync_runs') {
          return { select: vi.fn(() => emptyErpChain) }
        }
        if (table === 'audit_log') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => emptyErpChain),
            })),
          }
        }
        return { select: vi.fn(() => ({})) }
      }),
    } as never

    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findGlobal: vi.fn().mockResolvedValue({}),
    } as never

    const alerts = await buildSystemAlerts({
      payload,
      supabase,
      user: { staffRoles: ['administracion'] },
      now: new Date('2026-06-05T12:00:00Z'),
    })

    const pending = alerts.find((a) => a.id === 'pending-customers')
    expect(pending?.href).toBe('/admin/customers?status=pending')
  })
})
