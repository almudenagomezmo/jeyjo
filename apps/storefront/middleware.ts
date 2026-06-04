import { NextResponse, type NextRequest } from 'next/server'

import { isB2bValidated, isB2cOnly } from '@/lib/auth/redirect'
import { getCustomerContext } from '@/lib/auth/customer-context'
import { applyPortalRequestHeader, updateSession } from '@/lib/supabase/middleware'

const ACCOUNT_PREFIX = '/cuenta'
const INTRANET_PREFIX = '/intranet'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/mi-cuenta' || pathname.startsWith('/mi-cuenta/')) {
    const suffix = pathname.slice('/mi-cuenta'.length) || ''
    return NextResponse.redirect(new URL(`${ACCOUNT_PREFIX}${suffix}`, request.url), 308)
  }

  const { response, userId } = await updateSession(request)

  const isProtectedAccount =
    pathname === ACCOUNT_PREFIX || pathname.startsWith(`${ACCOUNT_PREFIX}/`)
  const isIntranet = pathname === INTRANET_PREFIX || pathname.startsWith(`${INTRANET_PREFIX}/`)
  const isAuthPage = pathname === '/login' || pathname === '/registro'

  if (!isProtectedAccount && !isIntranet && !isAuthPage) {
    return response
  }

  if (!userId) {
    if (isProtectedAccount || isIntranet) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', pathname)
      return NextResponse.redirect(login)
    }
    return response
  }

  const ctx = await getCustomerContext(userId)

  if (isAuthPage) {
    if (ctx) {
      const dest = ctx.validatedAt && ctx.customerGroup >= 2 && ctx.customerGroup <= 4
        ? INTRANET_PREFIX
        : ACCOUNT_PREFIX
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return response
  }

  if (isProtectedAccount && !ctx) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  if (isIntranet && ctx) {
    if (isB2cOnly(ctx) || !isB2bValidated(ctx)) {
      const cuenta = new URL(ACCOUNT_PREFIX, request.url)
      cuenta.searchParams.set('error', 'forbidden')
      return NextResponse.redirect(cuenta)
    }
    return applyPortalRequestHeader(request, response)
  }

  return response
}

export const config = {
  matcher: [
    '/cuenta/:path*',
    '/intranet/:path*',
    '/login',
    '/registro',
    '/mi-cuenta',
    '/mi-cuenta/:path*',
  ],
}
