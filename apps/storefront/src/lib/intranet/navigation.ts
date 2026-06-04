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
    scaffold: {
      title: 'Facturas emitidas',
      description:
        'Consulta y descarga de facturas de los últimos 5 años sincronizadas desde Avansuite. Disponible en la fase documental del portal.',
      roadmapRef: '#37 area-documental-financiera',
    },
  },
  {
    href: '/intranet/contabilidad/albaranes',
    label: 'Albaranes',
    scaffold: {
      title: 'Albaranes',
      description:
        'Seguimiento de albaranes emitidos y en preparación desde el ERP. Disponible en la fase documental del portal.',
      roadmapRef: '#37 area-documental-financiera',
    },
  },
  {
    href: '/intranet/contabilidad/vencimientos',
    label: 'Vencimientos',
    scaffold: {
      title: 'Vencimientos',
      description:
        'Facturas pendientes de pago con semáforo de vencimiento y saldo acumulado. Disponible en la fase documental del portal.',
      roadmapRef: '#37 area-documental-financiera',
    },
  },
  {
    href: '/intranet/contabilidad/cifra-347',
    label: 'Cifra 347',
    scaffold: {
      title: 'Cifra 347',
      description:
        'Declaración informativa de operaciones con terceros para tu gestoría. Disponible en la fase documental del portal.',
      roadmapRef: '#37 area-documental-financiera',
    },
  },
  {
    href: '/intranet/contabilidad/presupuestos',
    label: 'Presupuestos',
    scaffold: {
      title: 'Presupuestos',
      description:
        'Presupuestos vigentes y caducados emitidos por Jeyjo. Disponible en la fase documental del portal.',
      roadmapRef: '#37 area-documental-financiera',
    },
  },
]

export const INTRANET_PRIMARY_NAV: IntranetNavItem[] = [
  {
    href: '/intranet/mi-cuenta',
    label: 'Mi cuenta',
    scaffold: {
      title: 'Mi cuenta',
      description:
        'Datos de empresa, usuarios subordinados y preferencias de acceso. La gestión de subusuarios llegará en una fase posterior.',
      roadmapRef: '#26 b2b-subusers-permissions',
    },
  },
  {
    href: '/intranet/contabilidad',
    label: 'Contabilidad',
    children: CONTABILIDAD_SUBNAV,
  },
  {
    href: '/intranet/pedidos',
    label: 'Histórico de pedidos',
    scaffold: {
      title: 'Histórico de pedidos',
      description:
        'Consulta tus compras anteriores, repite pedidos habituales y analiza tu consumo con precios actuales.',
      roadmapRef: '#23 purchase-history-repeat',
    },
  },
  {
    href: '/intranet/pedido-rapido',
    label: 'Pedido rápido',
    scaffold: {
      title: 'Pedido rápido',
      description: 'Introduce referencias manualmente o importa un Excel para reabastecer tu stock en minutos.',
      roadmapRef: '#24 quick-order-excel',
    },
  },
  {
    href: '/intranet/precios',
    label: 'Precios especiales',
    scaffold: {
      title: 'Precios especiales',
      description: 'Consulta tus tarifas pactadas y descuentos aplicables artículo a artículo.',
      roadmapRef: '#25 custom-tariffs-view',
    },
  },
  {
    href: '/intranet/rma',
    label: 'RMA e incidencias',
    scaffold: {
      title: 'RMA e incidencias',
      description: 'Abre y sigue devoluciones o incidencias de entrega desde el portal.',
      roadmapRef: '#27 rma-incidents',
    },
  },
  {
    href: '/intranet/stock',
    label: 'Avisos de stock',
    scaffold: {
      title: 'Avisos de stock',
      description: 'Recibe avisos cuando vuelva a haber stock de referencias que sigues.',
      roadmapRef: '#28 notifications-center-email',
    },
  },
  {
    href: '/intranet/descargas',
    label: 'Descargas',
    scaffold: {
      title: 'Descargas',
      description: 'Catálogos, fichas técnicas y documentación comercial descargable.',
      roadmapRef: '#41 downloads-catalogs-portal',
    },
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
