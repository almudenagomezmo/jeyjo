import Link from 'next/link'

import type { BlogPostListItemDto } from '@/lib/blog/types'
import { formatBlogDate } from '@/lib/blog/format'

export function BlogPostCard({ post }: { post: BlogPostListItemDto }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:border-brand/40">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.featuredImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImageUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-muted" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-ink">
            {post.category.name}
          </span>
          <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
        </div>
        <h2 className="text-lg font-semibold text-ink">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? <p className="line-clamp-3 text-sm text-muted">{post.excerpt}</p> : null}
        <p className="mt-auto text-xs text-muted">Por {post.authorName}</p>
      </div>
    </article>
  )
}
