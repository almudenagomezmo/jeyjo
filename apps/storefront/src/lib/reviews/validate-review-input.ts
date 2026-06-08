export type ReviewInput = {
  rating: unknown
  comment: unknown
}

export type ValidatedReviewInput = {
  rating: number
  comment: string
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

export function validateReviewInput(input: ReviewInput): ValidatedReviewInput | null {
  const rating =
    typeof input.rating === 'number'
      ? input.rating
      : typeof input.rating === 'string'
        ? Number.parseInt(input.rating, 10)
        : NaN

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null

  const rawComment = typeof input.comment === 'string' ? stripHtml(input.comment).trim() : ''
  if (rawComment.length < 10 || rawComment.length > 2000) return null

  return { rating, comment: rawComment }
}
