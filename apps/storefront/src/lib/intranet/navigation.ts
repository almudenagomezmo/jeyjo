export type IntranetScaffoldMeta = {
  title: string
  description: string
  roadmapRef: string
}

export type IntranetNavItem = {
  href: string
  label: string
  scaffold?: IntranetScaffoldMeta
  children?: IntranetNavItem[]
}

export const ACCOUNT_DASHBOARD_HREF = '/cuenta'
export const EMPRESA_PREFIX = '/cuenta/empresa'

/** @deprecated Use ACCOUNT_DASHBOARD_HREF */
export const INTRANET_DASHBOARD_HREF = ACCOUNT_DASHBOARD_HREF

export const CONTABILIDAD_SUBNAV: IntranetNavItem[] = [
  {
    href: '/cuenta/empresa/contabilidad/facturas',
    label: 'Facturas emitidas',
  },
  {
    href: '/cuenta/empresa/contabilidad/albaranes',
    label: 'Albaranes',
  },
  {
    href: '/cuenta/empresa/contabilidad/vencimientos',
    label: 'Vencimientos',
  },
  {
    href: '/cuenta/empresa/contabilidad/cifra-347',
    label: 'Cifra 347',
  },
  {
    href: '/cuenta/empresa/contabilidad/presupuestos',
    label: 'Presupuestos',
  },
]

export const EMPRESA_PRIMARY_NAV: IntranetNavItem[] = [
  {
    href: '/cuenta/empresa/preferencias',
    label: 'Preferencias',
  },
  {
    href: '/cuenta/empresa/contabilidad',
    label: 'Contabilidad',
    children: CONTABILIDAD_SUBNAV,
  },
  {
    href: '/cuenta/empresa/pedidos',
    label: 'Histórico de pedidos',
  },
  {
    href: '/cuenta/empresa/pedido-rapido',
    label: 'Pedido rápido',
  },
  {
    href: '/cuenta/empresa/precios',
    label: 'Precios especiales',
  },
  {
    href: '/cuenta/empresa/rma',
    label: 'RMA e incidencias',
  },
  {
    href: '/cuenta/empresa/descargas',
    label: 'Descargas',
  },
  {
    href: '/cuenta/empresa/contacto',
    label: 'Contacto',
    scaffold: {
      title: 'Contacto',
      description:
        'Canales de contacto con tu comercial y soporte. El centro de mensajes integrado llegará en una fase posterior.',
      roadmapRef: '#28 notifications-center-email',
    },
  },
]

/** @deprecated Use EMPRESA_PRIMARY_NAV */
export const INTRANET_PRIMARY_NAV = EMPRESA_PRIMARY_NAV

export function customerGroupLabel(group: number): string {
  switch (group) {
    case 2:
      return 'Empresa B2B'
    case 3:
      return 'Colegios'
    case 4:
      return 'Concursos públicos'
    default:
      return 'Cliente'
  }
}

export function getScaffoldForPath(pathname: string): IntranetScaffoldMeta | null {
  for (const item of EMPRESA_PRIMARY_NAV) {
    if (item.scaffold && item.href === pathname) return item.scaffold
    for (const child of item.children ?? []) {
      if (child.scaffold && child.href === pathname) return child.scaffold
    }
  }
  return null
}

export function getQuickAccessSections(): IntranetNavItem[] {
  return EMPRESA_PRIMARY_NAV
}
