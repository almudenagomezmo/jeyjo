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

export const INTRANET_DASHBOARD_HREF = '/intranet'

export const CONTABILIDAD_SUBNAV: IntranetNavItem[] = [
  {
    href: '/intranet/contabilidad/facturas',
    label: 'Facturas emitidas',
  },
  {
    href: '/intranet/contabilidad/albaranes',
    label: 'Albaranes',
  },
  {
    href: '/intranet/contabilidad/vencimientos',
    label: 'Vencimientos',
  },
  {
    href: '/intranet/contabilidad/cifra-347',
    label: 'Cifra 347',
  },
  {
    href: '/intranet/contabilidad/presupuestos',
    label: 'Presupuestos',
  },
]

export const INTRANET_PRIMARY_NAV: IntranetNavItem[] = [
  {
    href: '/intranet/mi-cuenta',
    label: 'Mi cuenta',
  },
  {
    href: '/intranet/contabilidad',
    label: 'Contabilidad',
    children: CONTABILIDAD_SUBNAV,
  },
  {
    href: '/intranet/pedidos',
    label: 'Histórico de pedidos',
  },
  {
    href: '/intranet/pedido-rapido',
    label: 'Pedido rápido',
  },
  {
    href: '/intranet/precios',
    label: 'Precios especiales',
  },
  {
    href: '/intranet/rma',
    label: 'RMA e incidencias',
  },
  {
    href: '/intranet/stock',
    label: 'Avisos de stock',
  },
  {
    href: '/intranet/descargas',
    label: 'Descargas',
  },
  {
    href: '/intranet/contacto',
    label: 'Contacto',
    scaffold: {
      title: 'Contacto',
      description:
        'Canales de contacto con tu comercial y soporte. El centro de mensajes integrado llegará en una fase posterior.',
      roadmapRef: '#28 notifications-center-email',
    },
  },
]

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
  for (const item of INTRANET_PRIMARY_NAV) {
    if (item.scaffold && item.href === pathname) return item.scaffold
    for (const child of item.children ?? []) {
      if (child.scaffold && child.href === pathname) return child.scaffold
    }
  }
  return null
}

export function getQuickAccessSections(): IntranetNavItem[] {
  return INTRANET_PRIMARY_NAV
}
