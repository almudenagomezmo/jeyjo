import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils/cn";
import type { PriceQuote } from "@jeyjo/pricing";
import type { PlpProductRow } from "@/lib/plp/types";
import type { PublicStockIndicator } from "@/lib/stock/types";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products?: readonly Product[];
  plpItems?: Array<{
    row: PlpProductRow;
    quote?: PriceQuote;
    stock?: PublicStockIndicator;
  }>;
  className?: string;
  onQuickView?: (sku: string) => void;
}

export function ProductGrid({ products, plpItems, className, onQuickView }: ProductGridProps) {
  if (plpItems?.length) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          className,
        )}
      >
        {plpItems.map(({ row, quote, stock }) => (
          <ProductCard
            key={row.sku}
            row={row}
            quote={quote}
            stock={stock}
            onQuickView={onQuickView ? () => onQuickView(row.sku) : undefined}
          />
        ))}
      </div>
    );
  }

  const list = products ?? [];
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {list.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
