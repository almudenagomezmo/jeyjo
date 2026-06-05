import type { Json } from '@jeyjo/database-types'

import type { CustomerContext } from '@/lib/auth/customer-context'
import type { IntranetNavItem } from '@/lib/intranet/navigation'

export type B2bSection = 'finance' | 'orders' | 'account'

export type B2bPermissions = {
  finance: boolean
  orders: boolean
  account: boolean
  ordersRequireApproval: boolean
}

export type EffectiveB2bPermissions = B2bPermissions & {
  isSuperadmin: boolean
}

export const DEFAULT_SUBUSER_PERMISSIONS: B2bPermissions = {
  finance: false,
  orders: true,
  account: false,
  ordersRequireApproval: false,
}

export const SUPERADMIN_PERMISSIONS: B2bPermissions = {
  finance: true,
  orders: true,
  account: true,
  ordersRequireApproval: false,
}

export function parseB2bPermissions(json: Json | null | undefined): B2bPermissions {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ...DEFAULT_SUBUSER_PERMISSIONS }
  }
  const row = json as Record<string, unknown>
  return {
    finance: Boolean(row.finance),
    orders: row.orders !== false,
    account: Boolean(row.account),
    ordersRequireApproval: Boolean(row.ordersRequireApproval),
  }
}

export function permissionsToJson(perms: B2bPermissions): Json {
  return {
    finance: perms.finance,
    orders: perms.orders,
    account: perms.account,
    ordersRequireApproval: perms.ordersRequireApproval,
  }
}

export function resolveEffectivePermissions(ctx: CustomerContext): EffectiveB2bPermissions {
  if (ctx.role === 'b2b_superadmin') {
    return { ...SUPERADMIN_PERMISSIONS, isSuperadmin: true }
  }
  if (ctx.role === 'b2b_subuser') {
    return { ...parseB2bPermissions(ctx.permissionsRaw), isSuperadmin: false }
  }
  return { ...DEFAULT_SUBUSER_PERMISSIONS, finance: false, orders: false, account: false, isSuperadmin: false }
}

export function canAccessSection(ctx: CustomerContext, section: B2bSection): boolean {
  const perms = resolveEffectivePermissions(ctx)
  return perms[section]
}

const NAV_SECTION_BY_HREF: Record<string, B2bSection> = {
  '/intranet/mi-cuenta': 'account',
  '/intranet/contabilidad': 'finance',
  '/intranet/pedidos': 'orders',
  '/intranet/pedido-rapido': 'orders',
  '/intranet/precios': 'orders',
  '/intranet/rma': 'orders',
  '/intranet/stock': 'orders',
  '/intranet/descargas': 'orders',
  '/intranet/contacto': 'orders',
}

const PATH_PREFIX_SECTION: Array<{ prefix: string; section: B2bSection }> = [
  { prefix: '/intranet/contabilidad', section: 'finance' },
  { prefix: '/intranet/mi-cuenta', section: 'account' },
  { prefix: '/intranet/pedidos', section: 'orders' },
  { prefix: '/intranet/pedido-rapido', section: 'orders' },
  { prefix: '/intranet/precios', section: 'orders' },
  { prefix: '/intranet/rma', section: 'orders' },
  { prefix: '/intranet/stock', section: 'orders' },
  { prefix: '/intranet/descargas', section: 'orders' },
  { prefix: '/intranet/contacto', section: 'orders' },
]

export function sectionForIntranetPath(pathname: string): B2bSection | null {
  for (const { prefix, section } of PATH_PREFIX_SECTION) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return section
    }
  }
  return null
}

export function sectionForNavHref(href: string): B2bSection | null {
  return NAV_SECTION_BY_HREF[href] ?? null
}

export function filterIntranetNav(
  items: IntranetNavItem[],
  ctx: CustomerContext,
): IntranetNavItem[] {
  const perms = resolveEffectivePermissions(ctx)
  return items.filter((item) => {
    const section = sectionForNavHref(item.href)
    if (!section) return true
    return perms[section]
  })
}

export function canManageSubusers(ctx: CustomerContext): boolean {
  return ctx.role === 'b2b_superadmin'
}

export function requiresOrderCompanyApproval(ctx: CustomerContext): boolean {
  if (ctx.role !== 'b2b_subuser') return false
  return resolveEffectivePermissions(ctx).ordersRequireApproval
}
