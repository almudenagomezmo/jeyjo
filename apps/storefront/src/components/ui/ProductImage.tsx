import Image from "next/image";

import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { LeafIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

interface ProductImageProps {
  product: Pick<Product, "glyph" | "colors" | "eco">;
  imageUrl?: string | null;
  glyphSize?: number;
  className?: string;
  showEco?: boolean;
  alt?: string;
  variant?: "default" | "thumb";
  priority?: boolean;
}

/**
 * Square product media slot. Uses CMS image when available; otherwise schematic glyph.
 */
export function ProductImage({
  product,
  imageUrl,
  glyphSize = 96,
  className,
  showEco = true,
  alt = "Producto",
  variant = "default",
  priority = false,
}: ProductImageProps) {
  const hasImage = Boolean(imageUrl?.trim());
  const isThumb = variant === "thumb";

  return (
    <div
      className={cn(
        "relative grid aspect-square place-items-center overflow-hidden rounded-md bg-surface-subtle",
        isThumb && "h-full w-full min-h-0",
        className,
      )}
      style={
        hasImage
          ? undefined
          : {
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent 0 8px, rgba(28,27,23,0.025) 8px 16px)",
            }
      }
    >
      {hasImage ? (
        <Image
          src={imageUrl!}
          alt={alt}
          fill
          className={cn("object-contain", isThumb ? "p-1" : "p-4")}
          sizes={isThumb ? "80px" : "(max-width: 768px) 100vw, 50vw"}
          priority={priority}
        />
      ) : (
        <ProductGlyph
          kind={product.glyph}
          size={glyphSize}
          primary={product.colors[0]}
          secondary={product.colors[1]}
        />
      )}
      {showEco && product.eco && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-green-700 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          <LeafIcon size={11} /> ECO
        </span>
      )}
    </div>
  );
}
