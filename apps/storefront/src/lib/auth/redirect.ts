import type { CustomerContext } from './customer-context'

export function loginRedirectPath(ctx: CustomerContext): string {
  if (!ctx.validatedAt && ctx.customerGroup > 1) {
    return '/cuenta'
  }
  if (ctx.validatedAt && ctx.customerGroup >= 2 && ctx.customerGroup <= 4) {
    return '/intranet'
  }
  return '/cuenta'
}

export function safeNextPath(next: string | null | undefined, fallback = '/cuenta'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback
  if (next.startsWith('/login') || next.startsWith('/registro')) return fallback
  return next
}

export function isB2bValidated(ctx: CustomerContext): boolean {
  return Boolean(ctx.validatedAt && ctx.customerGroup >= 2 && ctx.customerGroup <= 4)
}

export function isB2cOnly(ctx: CustomerContext): boolean {
  return ctx.customerGroup === 1 || !ctx.validatedAt
}
