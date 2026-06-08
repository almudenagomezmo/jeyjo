export type FooterLink = {
  label: string
  href: string
}

export type FooterLinkColumn = {
  title: string
  links: FooterLink[]
}

export const PURCHASE_COLUMN_LINKS: FooterLink[] = [
  { label: 'Envíos y plazos', href: '/legal/envios' },
  { label: 'Devoluciones y RMA', href: '/legal/devoluciones' },
  { label: 'Formas de pago', href: '/legal/formas-pago' },
  { label: 'Empresas B2B', href: '/registro' },
  { label: 'Solicitar presupuesto', href: '/presupuesto' },
]

export function buildHelpColumnLinks(blogEnabled: boolean, blogLabel: string): FooterLink[] {
  const links: FooterLink[] = [
    { label: 'Centro de ayuda', href: '/ayuda/faq' },
    { label: 'Contacto', href: '/legal/contacto' },
    { label: 'Mi cuenta', href: '/cuenta' },
    { label: 'Buscar', href: '/search' },
    { label: 'Seguimiento de pedido', href: '/cuenta/pedidos' },
    { label: 'Privacidad', href: '/legal/privacidad' },
    { label: 'Cookies', href: '/legal/cookies' },
  ]

  if (blogEnabled) {
    links.splice(1, 0, { label: blogLabel, href: '/blog' })
  }

  return links
}

export const LEGAL_BAR_LINKS: FooterLink[] = [
  { label: 'Aviso legal', href: '/legal/aviso-legal' },
  { label: 'Privacidad', href: '/legal/privacidad' },
  { label: 'Cookies', href: '/legal/cookies' },
]
