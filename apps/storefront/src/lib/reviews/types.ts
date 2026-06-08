export type ProductReviewPublic = {
  id: number
  rating: number
  comment: string
  authorDisplayName: string
  createdAt: string
}

export type ProductReviewMine = ProductReviewPublic & {
  status: 'pending' | 'approved' | 'rejected'
  rejectionNote: string | null
  updatedAt: string
}

export type ProductReviewsPage = {
  docs: ProductReviewPublic[]
  total: number
  page: number
  pageSize: number
}
