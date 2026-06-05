import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { cmsSyncNewsletterEsp } from '@/lib/newsletter/cms-internal'
import { getSubscriberByUnsubscribeToken, unsubscribeSubscriber } from '@/lib/newsletter/repository'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type PageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function NewsletterUnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const supabase = getSupabaseAdminClient()

  if (!token?.trim() || !supabase) {
    return <NewsletterMessage title="Enlace no válido" body="No hemos podido procesar esta solicitud." />
  }

  const row = await getSubscriberByUnsubscribeToken(supabase, token.trim())
  if (!row) {
    return <NewsletterMessage title="Enlace no válido" body="No hemos podido procesar esta solicitud." />
  }

  if (row.status !== 'unsubscribed') {
    const updated = await unsubscribeSubscriber(supabase, row.id)
    await cmsSyncNewsletterEsp(updated.id, 'remove')
  }

  return (
    <NewsletterMessage
      title="Baja confirmada"
      body="Ya no recibirás emails de marketing de Jeyjo. Puedes volver a suscribirte cuando quieras desde el pie de página."
      actionHref="/"
      actionLabel="Volver a la tienda"
    />
  )
}

function NewsletterMessage({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string
  body: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Container>
  )
}
