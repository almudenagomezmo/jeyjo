import { INTRANET_DASHBOARD_HREF } from '@/lib/intranet/navigation'

export function isIntranetNavItemActive(pathname: string, href: string): boolean {
  if (href === INTRANET_DASHBOARD_HREF) {
    return pathname === INTRANET_DASHBOARD_HREF
  }

  if (pathname === href) return true

  if (href !== INTRANET_DASHBOARD_HREF && pathname.startsWith(`${href}/`)) {
    return true
  }

  return false
}
