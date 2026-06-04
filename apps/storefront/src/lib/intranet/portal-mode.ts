export const PORTAL_HEADER = 'x-jeyjo-portal'

export function isPortalModeFromHeaders(headers: Headers): boolean {
  return headers.get(PORTAL_HEADER) === '1'
}

export function isIntranetPath(pathname: string): boolean {
  return pathname === '/intranet' || pathname.startsWith('/intranet/')
}
