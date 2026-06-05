"use client";

import Link from "next/link";
import type { PriceQuote } from "@jeyjo/pricing";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockBadge, StockIndicatorBadge } from "@/components/ui/StockBadge";
import { HeartIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import {
  discountPercent,
  getDualPrice,
  getPriceView,
  getPriceViewFromQuote,
} from "@/lib/utils/price";
import { plpRowToProduct } from "@/lib/plp/row-to-product";
import type { PlpProductRow } from "@/lib/plp/types";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useWishlistToggle } from "@/lib/hooks/useWishlistToggle";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { PublicStockIndicator } from "@/lib/stock/types";
import type { Product } from "@/lib/types";

interface ProductCardBaseProps {
  onQuickView?: () => void;
}

interface LegacyProductCardProps extends ProductCardBaseProps {
  product: Product;
  row?: never;
  quote?: never;
  stock?: never;
}

interface PlpProductCardProps extends ProductCardBaseProps {
  row: PlpProductRow;
  quote?: PriceQuote;
  stock?: PublicStockIndicator;
  product?: never;
}

export type ProductCardProps = LegacyProductCardProps | PlpProductCardProps;

export function ProductCard(props: ProductCardProps) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistId = props.row?.sku ?? props.product?.id ?? "";
  const productName = props.row?.title ?? props.product?.name ?? "";
  const { toggleWithSync, has } = useWishlistToggle(productName);
  const wishlisted = has(wishlistId);

  const product =
    props.product ?? (props.row ? plpRowToProduct(props.row, props.quote) : null);
  if (!product) return null;

  const mode = hydrated ? priceMode : "b2c";
  const priceView = props.quote
    ? getPriceViewFromQuote(props.quote)
    : getPriceView(product);
  const dual = getDualPrice(priceView, mode);
  const discount = props.quote
    ? props.quote.listUnit != null && props.quote.listUnit > props.quote.netUnit
      ? Math.round((1 - props.quote.netUnit / props.quote.listUnit) * 100)
      : null
    : discountPercent(product);

  const canAddCart =
    props.stock != null
      ? props.stock.level === "available" ||
        props.stock.level === "low" ||
        props.stock.allowOrderWithoutStock
      : product.stock > 0;

  const packUnit = props.row?.packUnit ?? product.packSize;

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-[border-color,transform] hover:-translate-y-0.5 hover:border-border-strong">
      <div className="relative p-4 pb-0">
        <Link href={`/p/${product.id}`} aria-label={product.name}>
          <ProductImage
            product={product}
            imageUrl={props.row?.imageUrl ?? undefined}
            glyphSize={120}
          />
        </Link>
        <div className="absolute left-6 top-6 flex flex-col gap-1">
          {discount != null && discount > 0 && (
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
          onClick={() => toggleWithSync(wishlistId)}
          aria-label="Añadir a favoritos"
          aria-pressed={wishlisted}
          className={cn(
            "absolute right-6 top-6 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface",
            hydrated && wishlisted ? "text-danger" : "text-text-tertiary",
          )}
        >
          <HeartIcon size={14} fill={hydrated && wishlisted ? "currentColor" : "none"} />
        </button>
        {props.onQuickView && (
          <button
            type="button"
            onClick={props.onQuickView}
            className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            Vista rápida
          </button>
        )}
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
                discount != null && discount > 0 ? "text-danger-text" : "text-text",
              )}
            >
              {formatMoney(dual.primary)}
            </span>
          </div>
          <p className="text-[10px] text-text-tertiary">
            {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {product.vat}%
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1">
          {props.stock ? (
            <StockIndicatorBadge indicator={props.stock} packSize={packUnit} />
          ) : (
            <StockBadge stock={product.stock} packSize={packUnit} />
          )}
          <button
            type="button"
            disabled={!canAddCart}
            onClick={() => {
              addItem(product.id, packUnit);
              setMiniCartOpen(true);
            }}
            aria-label="Añadir al carrito"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-on-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-tertiary"
          >
            <PlusIcon size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Card>
  );
}
