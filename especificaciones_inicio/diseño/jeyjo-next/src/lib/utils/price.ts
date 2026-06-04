import type { PriceMode, PriceView, Product } from "@/lib/types";

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function withVat(priceNoVat: number, vat: number): number {
  return round2(priceNoVat * (1 + vat / 100));
}

/**
 * Build the pricing view-model for a product.
 *
 * Pricing rule (mirrors the design brief):
 *  - B2C: the prominent figure is the VAT-inclusive price; the secondary
 *    line shows the price without VAT.
 *  - B2B: the prominent figure is the base price WITHOUT VAT; the secondary
 *    line shows the VAT-inclusive price.
 *
 * The `mode` only changes which figure the UI emphasises — both are derived
 * here so the component layer stays dumb.
 */
export function getPriceView(product: Product): PriceView {
  const priceWithVat = withVat(product.priceNoVat, product.vat);
  const view: PriceView = { priceNoVat: product.priceNoVat, priceWithVat };
  if (product.offer) {
    view.originalNoVat = product.offer.originalNoVat;
    view.originalWithVat = withVat(product.offer.originalNoVat, product.vat);
  }
  return view;
}

export interface DualPrice {
  /** Large, emphasised figure. */
  primary: number;
  primaryLabel: string;
  /** Small secondary figure. */
  secondary: number;
  secondaryLabel: string;
  original?: number;
}

export function getDualPrice(view: PriceView, mode: PriceMode): DualPrice {
  if (mode === "b2b") {
    return {
      primary: view.priceNoVat,
      primaryLabel: "Sin IVA",
      secondary: view.priceWithVat,
      secondaryLabel: "IVA inc.",
      original: view.originalNoVat,
    };
  }
  return {
    primary: view.priceWithVat,
    primaryLabel: "IVA inc.",
    secondary: view.priceNoVat,
    secondaryLabel: "Sin IVA",
    original: view.originalWithVat,
  };
}

export function discountPercent(product: Product): number | null {
  if (!product.offer) return null;
  return Math.round((1 - product.priceNoVat / product.offer.originalNoVat) * 100);
}
