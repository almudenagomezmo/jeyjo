import { NextResponse } from 'next/server'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'
import { isB2bValidated } from '@/lib/auth/redirect'
import type { B2bSection } from '@/lib/b2b/permissions'
import { canAccessSection, canManageSubusers } from '@/lib/b2b/permissions'
import { isB2bPermissionsEnabled } from '@/lib/b2b/env'

export type B2bApiSessionOptions = {
  section?: B2bSection
}

export async function requireB2bApiSession(options: B2bApiSessionOptions = {}) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!ctx.isActive) {
    return { error: NextResponse.json({ error: 'Account disabled' }, { status: 403 }) }
  }
  if (!isB2bValidated(ctx)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  if (isB2bPermissionsEnabled() && options.section && !canAccessSection(ctx, options.section)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return {
    ctx,
    customerId: pricingCustomerId(ctx) ?? ctx.customerId,
  }
}

export async function requireB2bSuperadmin() {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!ctx.isActive) {
    return { error: NextResponse.json({ error: 'Account disabled' }, { status: 403 }) }
  }
  if (!isB2bValidated(ctx) || !canManageSubusers(ctx)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ctx, customerId: ctx.customerId }
}
