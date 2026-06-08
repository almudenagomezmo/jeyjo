import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/layout/Container'
import { SitePageContent } from '@/components/site-pages/SitePageContent'
import { fetchSitePage } from '@/lib/footer/fetch-site-page'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await fetchSitePage(slug)
  if (!page || page.pageType !== 'legal') {
    return { title: 'Página no encontrada | Jeyjo' }
  }

  return {
    title: `${page.title} | Jeyjo`,
    description: page.metaDescription ?? undefined,
  }
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params
  const page = await fetchSitePage(slug)

  if (!page || page.pageType !== 'legal') {
    notFound()
  }

  return (
    <Container className="py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink">{page.title}</h1>
      <SitePageContent content={page.content} />
    </Container>
  )
}
