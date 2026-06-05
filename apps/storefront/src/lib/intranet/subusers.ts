import type { Database } from '@jeyjo/database-types'

import type { B2bPermissions } from '@/lib/b2b/permissions'
import { parseB2bPermissions, permissionsToJson } from '@/lib/b2b/permissions'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type SubuserRow = {
  id: string
  email: string
  displayName: string | null
  isActive: boolean
  permissions: B2bPermissions
  lastLoginAt: string | null
  createdAt: string
}

function mapSubuserRow(row: {
  id: string
  email: string
  display_name: string | null
  is_active: boolean
  permissions: unknown
  last_login_at: string | null
  created_at: string
}): SubuserRow {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    isActive: row.is_active,
    permissions: parseB2bPermissions(row.permissions as never),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }
}

export async function listCompanySubusers(customerId: string): Promise<SubuserRow[]> {
  const admin = getSupabaseAdminClient()
  if (!admin) return []

  const { data } = await admin
    .from('web_profiles')
    .select('id, email, display_name, is_active, permissions, last_login_at, created_at')
    .eq('customer_id', customerId)
    .eq('role', 'b2b_subuser')
    .order('created_at', { ascending: true })

  return (data ?? []).map(mapSubuserRow)
}

export async function createCompanySubuser(input: {
  customerId: string
  email: string
  password: string
  displayName: string
  permissions: B2bPermissions
}): Promise<{ id: string } | { error: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { error: 'Auth not configured' }

  const email = input.email.trim().toLowerCase()
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    const msg = authError?.message ?? 'Could not create user'
    if (msg.toLowerCase().includes('already')) return { error: 'Email already registered' }
    return { error: msg }
  }

  const { error: rpcError } = await admin.rpc('create_b2b_subuser', {
    p_user_id: authUser.user.id,
    p_customer_id: input.customerId,
    p_email: email,
    p_display_name: input.displayName.trim(),
    p_permissions: permissionsToJson(input.permissions),
  })

  if (rpcError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: rpcError.message }
  }

  return { id: authUser.user.id }
}

export async function updateCompanySubuser(input: {
  customerId: string
  subuserId: string
  displayName?: string
  permissions?: B2bPermissions
  isActive?: boolean
  password?: string
}): Promise<{ ok: true } | { error: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { error: 'Auth not configured' }

  const { data: existing } = await admin
    .from('web_profiles')
    .select('id, role, customer_id')
    .eq('id', input.subuserId)
    .maybeSingle()

  if (!existing || existing.role !== 'b2b_subuser' || existing.customer_id !== input.customerId) {
    return { error: 'Subuser not found' }
  }

  const patch: Database['public']['Tables']['web_profiles']['Update'] = {}
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim() || null
  if (input.permissions !== undefined) patch.permissions = permissionsToJson(input.permissions)
  if (input.isActive !== undefined) patch.is_active = input.isActive

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from('web_profiles').update(patch).eq('id', input.subuserId)
    if (error) return { error: error.message }
  }

  if (input.password?.trim()) {
    const { error } = await admin.auth.admin.updateUserById(input.subuserId, {
      password: input.password,
    })
    if (error) return { error: error.message }
  }

  return { ok: true }
}
