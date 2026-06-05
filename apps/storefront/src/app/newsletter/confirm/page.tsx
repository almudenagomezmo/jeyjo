import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { cmsSyncNewsletterEsp } from '@/lib/newsletter/cms-internal'
import {
  confirmSubscriber,
  getSubscriberByConfirmToken,
  isConfirmTokenExpired,
} from '@/lib/newsletter/repository'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type PageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function NewsletterConfirmPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const supabase = getSupabaseAdminClient()

  if (!token?.trim() || !supabase) {
    return <NewsletterMessage title="Enlace no válido" body="No hemos podido procesar esta solicitud." />
  }

  const row = await getSubscriberByConfirmToken(supabase, token.trim())
  if (!row || row.status !== 'pending') {
    return <NewsletterMessage title="Enlace no válido" body="No hemos podido procesar esta solicitud." />
  }

  if (isConfirmTokenExpired(row.updated_at)) {
    return (
      <NewsletterMessage
        title="Enlace caducado"
        body="El enlace de confirmación ha expirado. Puedes suscribirte de nuevo desde el pie de página."
        actionHref="/"
        actionLabel="Volver a la tienda"
      />
    )
  }

  const confirmed = await confirmSubscriber(supabase, row.id)
  await cmsSyncNewsletterEsp(confirmed.id, 'upsert')

  return (
    <NewsletterMessage
      title="Suscripción confirmada"
      body="Gracias. Ya estás suscrito a la newsletter de Jeyjo."
      actionHref="/"
      actionLabel="Seguir comprando"
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
