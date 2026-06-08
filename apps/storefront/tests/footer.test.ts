import { describe, expect, it } from 'vitest'

import { resolvePublicContact, telHref, whatsappHref } from '@/lib/footer/contact'
import {
  LEGAL_BAR_LINKS,
  PURCHASE_COLUMN_LINKS,
  buildHelpColumnLinks,
} from '@/lib/footer/links'
import { DEFAULT_SYSTEM_CONFIG } from '@/lib/system-config/defaults'

describe('footer links', () => {
  it('purchase column has no hash hrefs', () => {
    for (const link of PURCHASE_COLUMN_LINKS) {
      expect(link.href).not.toBe('#')
      expect(link.href.startsWith('/')).toBe(true)
    }
  })

  it('legal bar links point to legal routes', () => {
    expect(LEGAL_BAR_LINKS.map((l) => l.href)).toEqual([
      '/legal/aviso-legal',
      '/legal/privacidad',
      '/legal/cookies',
    ])
  })

  it('blog link hidden by default in help column', () => {
    const links = buildHelpColumnLinks(false, 'Blog')
    expect(links.some((l) => l.href === '/blog')).toBe(false)
  })

  it('blog link shown when enabled', () => {
    const links = buildHelpColumnLinks(true, 'Blog corporativo')
    expect(links.find((l) => l.href === '/blog')?.label).toBe('Blog corporativo')
  })
})

describe('resolvePublicContact', () => {
  it('returns footer resolved contact and hours', () => {
    const config = {
      ...DEFAULT_SYSTEM_CONFIG,
      footer: {
        ...DEFAULT_SYSTEM_CONFIG.footer,
        businessHours: 'L-V 9-18',
        resolvedContact: {
          phone: '941000000',
          email: 'info@jeyjo.es',
          whatsapp: '34600111222',
        },
      },
    }

    const contact = resolvePublicContact(config)
    expect(contact.phone).toBe('941000000')
    expect(contact.businessHours).toBe('L-V 9-18')
  })
})

describe('contact href helpers', () => {
  it('builds tel and whatsapp links', () => {
    expect(telHref('+34 941 00 00 00')).toContain('tel:')
    expect(whatsappHref('+34 600 111 222')).toBe('https://wa.me/34600111222')
  })
})
