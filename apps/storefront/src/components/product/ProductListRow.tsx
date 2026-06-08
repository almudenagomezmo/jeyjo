"use client";

import Link from "next/link";
import type { PriceQuote } from "@jeyjo/pricing";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockBadge, StockIndicatorBadge } from "@/components/ui/StockBadge";
import { HeartIcon, LeafIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
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
import { useWishlistItem } from "@/lib/hooks/useWishlistToggle";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { PublicStockIndicator } from "@/lib/stock/types";
import type { Product } from "@/lib/types";

interface ProductListRowBaseProps {
  onQuickView?: () => void;
}

interface LegacyProductListRowProps extends ProductListRowBaseProps {
  product: Product;
  row?: never;
  quote?: never;
  stock?: never;
}

interface PlpProductListRowProps extends ProductListRowBaseProps {
  row: PlpProductRow;
  quote?: PriceQuote;
  stock?: PublicStockIndicator;
  product?: never;
}

export type ProductListRowProps = LegacyProductListRowProps | PlpProductListRowProps;

export function ProductListRow(props: ProductListRowProps) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistSku = props.row?.sku ?? props.product?.ref ?? "";
  const productName = props.row?.title ?? props.product?.name ?? "";
  const { wishlisted, toggleWithSync } = useWishlistItem(wishlistSku, productName);

  const product =
    props.product ?? (props.row ? plpRowToProduct(props.row, props.quote) : null);
  if (!product) return null;

  const mode = hydrated ? priceMode : "b2c";
  const priceView = props.quote
    ? getPriceViewFromQuote(props.quote)
    : getPriceView(product);
  const dual = getDualPrice(priceView, mode);
  const onOffer = dual.original != null;
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
    <Card className="group flex flex-col gap-3 overflow-hidden p-3 transition-[border-color,transform] hover:border-border-strong sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="relative w-full shrink-0 sm:w-28">
        <Link href={`/p/${product.id}`} aria-label={product.name} className="block">
          <ProductImage
            product={product}
            imageUrl={props.row?.imageUrl ?? undefined}
            glyphSize={72}
            showEco={false}
            className="aspect-[4/3] sm:aspect-square"
          />
        </Link>
        <div className="absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-1">
          {discount != null && discount > 0 && (
            <Badge tone="danger" size="sm">
              -{discount}%
            </Badge>
          )}
          {product.eco && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-[11px] font-bold leading-tight text-white">
              <LeafIcon size={10} /> ECO
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-medium text-text-tertiary">
          {product.brand} · {product.ref}
        </p>
        <Link
          href={`/p/${product.id}`}
          className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
          <span className="inline-flex items-center gap-1">
            <StarIcon size={11} className="text-warning" fill="currentColor" />
            <span className="font-semibold text-text-secondary">{product.rating}</span>
            <span>({product.reviews})</span>
          </span>
          {product.bestseller && (
            <Badge tone="warning" size="sm" icon={<StarIcon size={10} />}>
              Top ventas
            </Badge>
          )}
        </div>
        {props.stock ? (
          <div className="mt-2 sm:hidden">
            <StockIndicatorBadge indicator={props.stock} packSize={packUnit} />
          </div>
        ) : (
          <div className="mt-2 sm:hidden">
            <StockBadge stock={product.stock} packSize={packUnit} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
        <div className="text-left sm:text-right">
          <div className="flex flex-wrap items-baseline gap-1.5 sm:justify-end">
            {onOffer && (
              <span className="text-[13px] text-text-tertiary line-through tabular">
                {formatMoney(dual.original!)}
              </span>
            )}
            <span
              className={cn(
                "text-lg font-extrabold leading-none tracking-tight tabular",
                onOffer ? "text-danger-text" : "text-text",
              )}
            >
              {formatMoney(dual.primary)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-text-tertiary tabular">
            {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {product.vat}%
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {props.stock ? (
            <div className="hidden sm:block">
              <StockIndicatorBadge indicator={props.stock} packSize={packUnit} />
            </div>
          ) : (
            <div className="hidden sm:block">
              <StockBadge stock={product.stock} packSize={packUnit} />
            </div>
          )}
          <button
            type="button"
            onClick={() => toggleWithSync()}
            aria-label="Añadir a favoritos"
            aria-pressed={wishlisted}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-muted",
              hydrated && wishlisted ? "text-danger" : "text-text-secondary",
            )}
          >
            <HeartIcon size={14} fill={hydrated && wishlisted ? "currentColor" : "none"} />
          </button>
          {props.onQuickView && (
            <button
              type="button"
              onClick={props.onQuickView}
              className="hidden h-8 rounded-md border border-border px-2 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-surface-muted sm:inline-flex sm:items-center"
            >
              Vista rápida
            </button>
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
