/**
 * Domain types for the Jeyjo storefront.
 * Kept framework-agnostic so they can be shared between Server Components,
 * the (mock) data layer and the client cart store.
 */

export type GlyphKind =
  | "pen"
  | "notebook"
  | "paper"
  | "toner"
  | "ink"
  | "folder"
  | "binder"
  | "stapler"
  | "calc"
  | "scissors"
  | "marker"
  | "tape"
  | "recycle"
  | "bin"
  | "battery"
  | "printer"
  | "box";

export interface Subcategory {
  id: string;
  name: string;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  glyph: GlyphKind;
  subcategories: Subcategory[];
}

export interface ProductOffer {
  /** Original price (without VAT) before the discount. */
  originalNoVat: number;
}

export interface Product {
  id: string;
  /** Internal Jeyjo reference / supplier code. */
  ref: string;
  /** Manufacturer (OEM) reference, when available. */
  oem?: string;
  ean: string;
  name: string;
  brand: string;
  categoryId: string;
  subcategoryId: string;
  /** Base price excluding VAT, in EUR. */
  priceNoVat: number;
  /** VAT rate as a percentage, e.g. 21. */
  vat: number;
  /** Closed-pack size: products are sold in multiples of this. */
  packSize: number;
  stock: number;
  rating: number;
  reviews: number;
  glyph: GlyphKind;
  /** [primary, secondary] colors used by the schematic product glyph. */
  colors: readonly [string, string];
  description: string;
  tags: readonly string[];
  eco?: boolean;
  bestseller?: boolean;
  offer?: ProductOffer;
}

/** Pricing view-model used by the UI (handles the dual P1/P2 display). */
export interface PriceView {
  priceNoVat: number;
  priceWithVat: number;
  originalNoVat?: number;
  originalWithVat?: number;
}

export type PriceMode = "b2c" | "b2b";

export interface CartLine {
  productId: string;
  qty: number;
}
