import { describe, expect, it } from 'vitest'

import { validateReviewInput } from '@/lib/reviews/validate-review-input'

describe('validateReviewInput', () => {
  it('accepts valid rating and comment', () => {
    const result = validateReviewInput({ rating: 4, comment: '  Muy buen producto, lo recomiendo.  ' })
    expect(result).toEqual({
      rating: 4,
      comment: 'Muy buen producto, lo recomiendo.',
    })
  })

  it('rejects rating outside 1-5', () => {
    expect(validateReviewInput({ rating: 0, comment: 'Comentario válido largo' })).toBeNull()
    expect(validateReviewInput({ rating: 6, comment: 'Comentario válido largo' })).toBeNull()
  })

  it('rejects short comments', () => {
    expect(validateReviewInput({ rating: 5, comment: 'corto' })).toBeNull()
  })

  it('strips HTML tags from comment', () => {
    const result = validateReviewInput({
      rating: 3,
      comment: '<b>Texto</b> con etiquetas html',
    })
    expect(result?.comment).toBe('Texto con etiquetas html')
  })
})
