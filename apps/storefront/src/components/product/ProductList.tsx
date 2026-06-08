import { ProductListRow } from "@/components/product/ProductListRow";
import type { PriceQuote } from "@jeyjo/pricing";
import type { PlpProductRow } from "@/lib/plp/types";
import type { PublicStockIndicator } from "@/lib/stock/types";
import type { Product } from "@/lib/types";

interface ProductListProps {
  products?: readonly Product[];
  plpItems?: Array<{
    row: PlpProductRow;
    quote?: PriceQuote;
    stock?: PublicStockIndicator;
  }>;
  onQuickView?: (sku: string) => void;
}

export function ProductList({ products, plpItems, onQuickView }: ProductListProps) {
  if (plpItems?.length) {
    return (
      <div className="flex flex-col gap-3">
        {plpItems.map(({ row, quote, stock }) => (
          <ProductListRow
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
    <div className="flex flex-col gap-3">
      {list.map((product) => (
        <ProductListRow key={product.id} product={product} />
      ))}
    </div>
  );
}
