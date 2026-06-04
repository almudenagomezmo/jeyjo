import type { CartProductSnapshot } from '@/lib/cart/types'
import type { Product } from '@/lib/types'

/** Minimal {@link Product} shape for {@link ProductImage} glyph fallback. */
export function cartSnapshotToGlyphProduct(
  snapshot: CartProductSnapshot,
): Pick<Product, 'glyph' | 'colors' | 'eco'> {
  return {
    glyph: snapshot.glyph,
    colors: ['#94a3b8', '#64748b'] as const,
    eco: snapshot.eco,
  }
}
