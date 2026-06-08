import type { Metadata } from 'next'
import Link from 'next/link'

import { BlogPostCard } from '@/components/blog/BlogPostCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Container } from '@/components/layout/Container'
import { buildBlogPostsQueryString, parseBlogPageSearchParams } from '@/lib/blog/format'
import { fetchBlogCategories, fetchBlogPosts } from '@/lib/blog/fetch-posts'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Blog | Jeyjo',
  description: 'Noticias, consejos y novedades de material de oficina en Jeyjo.',
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const params = parseBlogPageSearchParams(await searchParams)
  const [postsResult, categoriesResult] = await Promise.all([
    fetchBlogPosts(params),
    fetchBlogCategories(),
  ])

  const posts = postsResult?.docs ?? []
  const categories = categoriesResult?.categories ?? []
  const page = postsResult?.page ?? params.page ?? 1
  const totalPages = postsResult?.totalPages ?? 0

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog' },
        ]}
      />

      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-ink">Blog</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Consejos, tendencias y novedades sobre material de oficina y compras B2B.
        </p>
      </header>

      {categories.length > 0 ? (
        <nav aria-label="Filtrar por categoría" className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-3 py-1 text-sm ${
              !params.category
                ? 'bg-brand text-brand-foreground'
                : 'border border-border bg-surface text-ink hover:border-brand/40'
            }`}
          >
            Todas
          </Link>
          {categories.map((category) => {
            const active = params.category === category.slug
            const href = `/blog${buildBlogPostsQueryString({ category: category.slug })}`
            return (
              <Link
                key={category.slug}
                href={href}
                className={`rounded-full px-3 py-1 text-sm ${
                  active
                    ? 'bg-brand text-brand-foreground'
                    : 'border border-border bg-surface text-ink hover:border-brand/40'
                }`}
              >
                {category.name}
              </Link>
            )
          })}
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-lg font-medium text-ink">Aún no hay artículos publicados</p>
          <p className="mt-2 text-sm text-muted">
            Vuelve pronto para leer novedades del blog de Jeyjo.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Paginación del blog" className="mt-10 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={`/blog${buildBlogPostsQueryString({ ...params, page: page - 1 })}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              ← Anterior
            </Link>
          ) : null}
          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>
          {postsResult?.hasNextPage ? (
            <Link
              href={`/blog${buildBlogPostsQueryString({ ...params, page: page + 1 })}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              Siguiente →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  )
}
