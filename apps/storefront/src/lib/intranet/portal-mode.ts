export const PORTAL_HEADER = 'x-jeyjo-portal'

export function isPortalModeFromHeaders(headers: Headers): boolean {
  return headers.get(PORTAL_HEADER) === '1'
}

export function isEmpresaPath(pathname: string): boolean {
  return pathname === '/cuenta/empresa' || pathname.startsWith('/cuenta/empresa/')
}

/** @deprecated Use isEmpresaPath */
export function isIntranetPath(pathname: string): boolean {
  return isEmpresaPath(pathname)
}
