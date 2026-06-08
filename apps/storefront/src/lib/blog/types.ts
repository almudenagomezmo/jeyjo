export type BlogCategoryDto = {
  slug: string
  name: string
}

export type BlogPostListItemDto = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  authorName: string
  tags: string[]
  category: BlogCategoryDto
  featuredImageUrl: string | null
}

export type BlogPostDetailDto = BlogPostListItemDto & {
  content: unknown
  metaDescription: string | null
}

export type BlogPostsListResponse = {
  docs: BlogPostListItemDto[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  limit: number
}

export type BlogCategoriesResponse = {
  categories: BlogCategoryDto[]
}

export type BlogListQuery = {
  page?: number
  category?: string | null
  tag?: string | null
}
