import { getProduct } from "@/lib/data/products";
import { getPriceView, getDualPrice } from "@/lib/utils/price";
import type { CartLine, PriceMode, Product } from "@/lib/types";

export interface DetailedLine {
  product: Product;
  qty: number;
  /** Unit price for the active mode (the emphasised figure). */
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  lines: DetailedLine[];
  itemCount: number;
  subtotal: number;
  /** Free-shipping threshold for the active mode. */
  shippingThreshold: number;
  shippingCost: number;
  amountToFreeShipping: number;
  total: number;
}

const SHIPPING = {
  b2c: { threshold: 39, cost: 5 },
  b2b: { threshold: 10, cost: 2.5 },
} as const;

export function buildCartSummary(lines: CartLine[], mode: PriceMode): CartSummary {
  const detailed: DetailedLine[] = lines
    .map((line) => {
      const product = getProduct(line.productId);
      if (!product) return null;
      const dual = getDualPrice(getPriceView(product), mode);
      return {
        product,
        qty: line.qty,
        unitPrice: dual.primary,
        lineTotal: Math.round(dual.primary * line.qty * 100) / 100,
      } satisfies DetailedLine;
    })
    .filter((l): l is DetailedLine => l !== null);

  const subtotal = Math.round(detailed.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const { threshold, cost } = SHIPPING[mode];
  const shippingCost = subtotal >= threshold || subtotal === 0 ? 0 : cost;

  return {
    lines: detailed,
    itemCount: detailed.reduce((s, l) => s + l.qty, 0),
    subtotal,
    shippingThreshold: threshold,
    shippingCost,
    amountToFreeShipping: Math.max(0, threshold - subtotal),
    total: Math.round((subtotal + shippingCost) * 100) / 100,
  };
}
