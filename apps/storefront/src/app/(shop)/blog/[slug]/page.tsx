import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Container } from '@/components/layout/Container'
import { SitePageContent } from '@/components/site-pages/SitePageContent'
import { formatBlogDate } from '@/lib/blog/format'
import { fetchBlogPost } from '@/lib/blog/fetch-posts'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchBlogPost(slug)
  if (!post) {
    return { title: 'Artículo no encontrado | Jeyjo' }
  }

  return {
    title: `${post.title} | Jeyjo`,
    description: post.metaDescription ?? post.excerpt ?? undefined,
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await fetchBlogPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      />

      <article className="mx-auto mt-6 max-w-3xl">
        {post.featuredImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImageUrl}
            alt=""
            className="mb-6 aspect-[16/9] w-full rounded-lg object-cover"
          />
        ) : null}

        <header className="mb-8 space-y-3">
          <Link
            href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
            className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink hover:text-brand"
          >
            {post.category.name}
          </Link>
          <h1 className="text-3xl font-bold text-ink">{post.title}</h1>
          <p className="text-sm text-muted">
            Por {post.authorName} ·{' '}
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          </p>
        </header>

        <SitePageContent content={post.content} />
      </article>
    </Container>
  )
}
