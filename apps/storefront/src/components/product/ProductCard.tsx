"use client";

import Link from "next/link";
import type { PriceQuote } from "@jeyjo/pricing";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockBadge, StockIndicatorBadge } from "@/components/ui/StockBadge";
import { HeartIcon, LeafIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
import { isCompareEnabled } from "@/lib/compare/is-compare-enabled";
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
import { useCompareStore } from "@/lib/store/compare-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useWishlistItem } from "@/lib/hooks/useWishlistToggle";
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
  const compareToggle = useCompareStore((s) => s.toggle);
  const compareSelected = useCompareStore((s) =>
    props.row ? s.items.some((i) => i.sku === props.row.sku) : false,
  );
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
  const showCompare = isCompareEnabled() && Boolean(props.row);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-[border-color,transform] hover:-translate-y-0.5 hover:border-border-strong">
      <div className="p-4 pb-0">
        <div className="relative">
          <Link href={`/p/${product.id}`} aria-label={product.name} className="block">
            <ProductImage
              product={product}
              imageUrl={props.row?.imageUrl ?? undefined}
              glyphSize={120}
              showEco={false}
            />
          </Link>
          <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
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
            {product.bestseller && (
              <Badge tone="warning" size="sm" icon={<StarIcon size={10} />}>
                Top ventas
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={() => toggleWithSync()}
            aria-label="Añadir a favoritos"
            aria-pressed={wishlisted}
            className={cn(
              "absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(28,27,23,0.12)] transition-[color,box-shadow] hover:shadow-[0_2px_6px_rgba(28,27,23,0.16)]",
              hydrated && wishlisted ? "text-danger" : "text-text-secondary",
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
        {product.reviews > 0 && product.rating > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
            <StarIcon size={11} className="text-warning" fill="currentColor" />
            <span className="font-semibold text-text-secondary">{product.rating}</span>
            <span>({product.reviews})</span>
          </div>
        )}

        <div className="mt-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
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

        {showCompare && props.row ? (
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={compareSelected}
              onChange={() =>
                compareToggle({
                  sku: props.row!.sku,
                  slug: props.row!.slug,
                  title: props.row!.title,
                  imageUrl: props.row!.imageUrl,
                })
              }
              aria-checked={compareSelected}
              className="h-4 w-4 rounded border-border text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            Comparar
          </label>
        ) : null}
      </div>
    </Card>
  );
}
