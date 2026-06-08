import {
  ACCOUNT_DASHBOARD_HREF,
  CONTABILIDAD_SUBNAV,
  EMPRESA_PRIMARY_NAV,
  type IntranetNavItem,
} from '@/lib/intranet/navigation'

export type IntranetBreadcrumb = {
  label: string
  href: string
}

function findPrimaryItem(pathname: string): IntranetNavItem | undefined {
  return EMPRESA_PRIMARY_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
}

function findContabilidadChild(pathname: string): IntranetNavItem | undefined {
  return CONTABILIDAD_SUBNAV.find((item) => pathname === item.href)
}

export function buildIntranetBreadcrumbs(pathname: string): IntranetBreadcrumb[] {
  const crumbs: IntranetBreadcrumb[] = [{ label: 'Mi cuenta', href: ACCOUNT_DASHBOARD_HREF }]

  if (!pathname.startsWith('/cuenta/empresa')) {
    return crumbs
  }

  const primary = findPrimaryItem(pathname)
  if (!primary) {
    return crumbs
  }

  crumbs.push({ label: primary.label, href: primary.href })

  if (primary.href === '/cuenta/empresa/contabilidad') {
    const child = findContabilidadChild(pathname)
    if (child && pathname !== primary.href) {
      crumbs.push({ label: child.label, href: child.href })
    }
  }

  return crumbs
}
