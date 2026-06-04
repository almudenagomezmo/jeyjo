import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { LeafIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductImageProps {
  product: Pick<Product, "glyph" | "colors" | "eco">;
  glyphSize?: number;
  className?: string;
  showEco?: boolean;
}

/**
 * Square product media slot. Renders a schematic glyph on a subtle striped
 * surface. Swap the inner glyph for `next/image` when real photography exists.
 */
export function ProductImage({
  product,
  glyphSize = 96,
  className,
  showEco = true,
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative grid aspect-square place-items-center overflow-hidden rounded-md bg-surface-subtle",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 8px, rgba(28,27,23,0.025) 8px 16px)",
      }}
    >
      <ProductGlyph kind={product.glyph} size={glyphSize} primary={product.colors[0]} secondary={product.colors[1]} />
      {showEco && product.eco && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-green-700 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          <LeafIcon size={11} /> ECO
        </span>
      )}
    </div>
  );
}
