import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { SitePageContent } from '@/components/site-pages/SitePageContent'
import { fetchFaqPage } from '@/lib/footer/fetch-site-page'
import { resolvePublicContact } from '@/lib/footer/contact'
import { fetchSystemConfig } from '@/lib/system-config/fetch'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes | Jeyjo',
  description: 'Respuestas a las dudas más habituales sobre compras, envíos y devoluciones.',
}

export default async function FaqPage() {
  const [page, config] = await Promise.all([fetchFaqPage(), fetchSystemConfig()])
  const contact = resolvePublicContact(config)

  if (!page) {
    return (
      <Container className="py-10">
        <h1 className="mb-4 text-2xl font-bold text-ink">Centro de ayuda</h1>
        <p className="mb-4 text-neutral-600">
          Estamos preparando las preguntas frecuentes. Mientras tanto, puedes contactarnos:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-neutral-700">
          {contact.phone && <li>Teléfono: {contact.phone}</li>}
          {contact.email && (
            <li>
              Email:{' '}
              <a href={`mailto:${contact.email}`} className="text-brand hover:underline">
                {contact.email}
              </a>
            </li>
          )}
          <li>
            <Link href="/legal/contacto" className="text-brand hover:underline">
              Ver datos de contacto
            </Link>
          </li>
        </ul>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink">{page.title}</h1>
      <SitePageContent content={page.content} />
    </Container>
  )
}
