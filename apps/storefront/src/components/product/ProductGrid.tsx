import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: readonly Product[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
