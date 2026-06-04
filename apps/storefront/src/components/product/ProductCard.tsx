"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockBadge } from "@/components/ui/StockBadge";
import { HeartIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import { getDualPrice, getPriceView, discountPercent } from "@/lib/utils/price";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const addItem = useCartStore((s) => s.addItem);
  const wishlisted = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const mode = hydrated ? priceMode : "b2c";
  const dual = getDualPrice(getPriceView(product), mode);
  const discount = discountPercent(product);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-[border-color,transform] hover:-translate-y-0.5 hover:border-border-strong">
      <div className="relative p-4 pb-0">
        <Link href={`/p/${product.id}`} aria-label={product.name}>
          <ProductImage product={product} glyphSize={120} />
        </Link>
        <div className="absolute left-6 top-6 flex flex-col gap-1">
          {discount != null && (
            <Badge tone="danger" size="sm">
              -{discount}%
            </Badge>
          )}
          {product.bestseller && (
            <Badge tone="warning" size="sm" icon={<StarIcon size={10} />}>
              Top ventas
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label="Añadir a favoritos"
          aria-pressed={wishlisted}
          className={cn(
            "absolute right-6 top-6 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface",
            hydrated && wishlisted ? "text-danger" : "text-text-tertiary",
          )}
        >
          <HeartIcon size={14} fill={hydrated && wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="font-mono text-[11px] font-medium text-text-tertiary">
          {product.brand} · {product.ref}
        </p>
        <Link
          href={`/p/${product.id}`}
          className="line-clamp-2 min-h-[36px] text-sm font-semibold leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
          <StarIcon size={11} className="text-warning" fill="currentColor" />
          <span className="font-semibold text-text-secondary">{product.rating}</span>
          <span>({product.reviews})</span>
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-lg font-extrabold tracking-tight",
                discount != null ? "text-danger-text" : "text-text",
              )}
            >
              {formatMoney(dual.primary)}
            </span>
          </div>
          <p className="text-[10px] text-text-tertiary">
            {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {product.vat}%
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <StockBadge stock={product.stock} packSize={product.packSize} />
          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => {
              addItem(product.id, product.packSize);
              setMiniCartOpen(true);
            }}
            aria-label="Añadir al carrito"
            className="grid h-8 w-8 place-items-center rounded-md bg-primary text-on-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-tertiary"
          >
            <PlusIcon size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Card>
  );
}
