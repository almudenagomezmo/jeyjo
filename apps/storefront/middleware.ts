import { NextResponse, type NextRequest } from 'next/server'

import { isB2bValidated, isB2cOnly } from '@/lib/auth/redirect'
import { getCustomerContext } from '@/lib/auth/customer-context'
import { applyPortalRequestHeader, updateSession } from '@/lib/supabase/middleware'

const ACCOUNT_PREFIX = '/cuenta'
const EMPRESA_PREFIX = '/cuenta/empresa'
const LEGACY_INTRANET_PREFIX = '/intranet'

const INTRANET_REDIRECTS: Record<string, string> = {
  '/intranet': '/cuenta',
  '/intranet/mi-cuenta': '/cuenta/empresa/preferencias',
  '/intranet/contabilidad': '/cuenta/empresa/contabilidad',
  '/intranet/contabilidad/facturas': '/cuenta/empresa/contabilidad/facturas',
  '/intranet/contabilidad/albaranes': '/cuenta/empresa/contabilidad/albaranes',
  '/intranet/contabilidad/vencimientos': '/cuenta/empresa/contabilidad/vencimientos',
  '/intranet/contabilidad/cifra-347': '/cuenta/empresa/contabilidad/cifra-347',
  '/intranet/contabilidad/presupuestos': '/cuenta/empresa/contabilidad/presupuestos',
  '/intranet/pedidos': '/cuenta/empresa/pedidos',
  '/intranet/pedido-rapido': '/cuenta/empresa/pedido-rapido',
  '/intranet/precios': '/cuenta/empresa/precios',
  '/intranet/rma': '/cuenta/empresa/rma',
  '/intranet/stock': '/cuenta/avisos-stock',
  '/intranet/descargas': '/cuenta/empresa/descargas',
  '/intranet/contacto': '/cuenta/empresa/contacto',
}

function legacyIntranetRedirect(pathname: string): string | null {
  if (pathname in INTRANET_REDIRECTS) {
    return INTRANET_REDIRECTS[pathname] ?? null
  }
  if (pathname.startsWith(`${LEGACY_INTRANET_PREFIX}/`)) {
    return `${EMPRESA_PREFIX}${pathname.slice(LEGACY_INTRANET_PREFIX.length)}`
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/mi-cuenta' || pathname.startsWith('/mi-cuenta/')) {
    const suffix = pathname.slice('/mi-cuenta'.length) || ''
    return NextResponse.redirect(new URL(`${ACCOUNT_PREFIX}${suffix}`, request.url), 308)
  }

  const legacyDest = legacyIntranetRedirect(pathname)
  if (legacyDest) {
    return NextResponse.redirect(new URL(legacyDest, request.url), 308)
  }

  const { response, userId } = await updateSession(request)

  const isProtectedAccount =
    pathname === ACCOUNT_PREFIX || pathname.startsWith(`${ACCOUNT_PREFIX}/`)
  const isEmpresa =
    pathname === EMPRESA_PREFIX || pathname.startsWith(`${EMPRESA_PREFIX}/`)
  const isAuthPage = pathname === '/login' || pathname === '/registro'

  if (!isProtectedAccount && !isAuthPage) {
    return response
  }

  if (!userId) {
    if (isProtectedAccount) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', pathname)
      return NextResponse.redirect(login)
    }
    return response
  }

  const ctx = await getCustomerContext(userId)

  if (isAuthPage) {
    if (ctx) {
      return NextResponse.redirect(new URL(ACCOUNT_PREFIX, request.url))
    }
    return response
  }

  if (isProtectedAccount && !ctx) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  if (isEmpresa && ctx) {
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
    '/intranet',
    '/login',
    '/registro',
    '/mi-cuenta',
    '/mi-cuenta/:path*',
  ],
}
