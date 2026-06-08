"use client";

import Link from "next/link";

import { JeyjoLoader } from "@/components/ui/JeyjoLoader";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { ProductImage } from "@/components/ui/ProductImage";
import { PlusIcon } from "@/components/ui/icons";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { formatMoney } from "@/lib/utils/format";
import { getDualPrice, getPriceViewFromQuote } from "@/lib/utils/price";
import type { SuggestCategory, SuggestProduct } from "@/lib/search/types";
import type { PriceMode } from "@/lib/types";

type SearchSuggestPanelProps = {
  query: string;
  products: SuggestProduct[];
  categories: SuggestCategory[];
  loading: boolean;
  error: string | null;
  priceMode: PriceMode;
  activeIndex: number;
  onSelect: () => void;
  onViewAll: () => void;
  optionIdPrefix: string;
};

const GLYPH_PLACEHOLDER = { glyph: "pen" as const, colors: ["", ""] as const, eco: false };

function SuggestThumbnail({ product }: { product: SuggestProduct }) {
  if (product.imageUrl?.trim()) {
    return (
      <ProductImage
        product={GLYPH_PLACEHOLDER}
        imageUrl={product.imageUrl}
        glyphSize={28}
        className="h-11 w-11"
        showEco={false}
        alt=""
      />
    );
  }
  return (
    <div className="grid h-11 w-11 place-items-center rounded-md bg-surface-subtle">
      <ProductGlyph kind="pen" size={28} />
    </div>
  );
}

function refsLine(product: SuggestProduct): string {
  const parts = [product.wholesaleRef, product.oemRef, product.ean].filter(Boolean);
  return parts.join(" · ");
}

export function SearchSuggestPanel({
  query,
  products,
  categories,
  loading,
  error,
  priceMode,
  activeIndex,
  onSelect,
  onViewAll,
  optionIdPrefix,
}: SearchSuggestPanelProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  let optionCounter = 0;

  if (loading && products.length === 0 && categories.length === 0) {
    return (
      <div className="p-8">
        <JeyjoLoader size="sm" label="Buscando…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-text-tertiary" role="alert">
        {error}
      </div>
    );
  }

  if (products.length === 0 && categories.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-tertiary">
        No hemos encontrado resultados para «{query}»
      </div>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <div className="px-4 pb-1 pt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
            Categorías sugeridas
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categorías sugeridas">
            {categories.map((c) => {
              const idx = optionCounter++;
              const isActive = activeIndex === idx;
              return (
                <Link
                  key={c.href}
                  id={`${optionIdPrefix}-opt-${idx}`}
                  href={c.href}
                  role="option"
                  aria-selected={isActive}
                  onClick={onSelect}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    isActive ? "bg-surface-hover ring-1 ring-border" : "bg-surface-muted hover:bg-surface-hover"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="p-2">
          <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
            Productos
          </p>
          <ul role="listbox" aria-label="Productos sugeridos">
            {products.map((p) => {
              const idx = optionCounter++;
              const isActive = activeIndex === idx;
              const dual = p.priceQuote
                ? getDualPrice(getPriceViewFromQuote(p.priceQuote), priceMode)
                : null;

              return (
                <li key={p.sku} role="presentation">
                  <div
                    className={`flex items-center gap-2 rounded-md p-2 ${
                      isActive ? "bg-surface-muted ring-1 ring-border" : "hover:bg-surface-muted"
                    }`}
                  >
                    <Link
                      id={`${optionIdPrefix}-opt-${idx}`}
                      href={p.href}
                      role="option"
                      aria-selected={isActive}
                      onClick={onSelect}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <SuggestThumbnail product={p} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{p.title}</p>
                        <p className="font-mono text-[11px] text-text-tertiary">{refsLine(p)}</p>
                      </div>
                      {dual && (
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatMoney(dual.primary)}</p>
                          <p className="text-[10px] text-text-tertiary">{dual.primaryLabel}</p>
                        </div>
                      )}
                    </Link>
                    <button
                      type="button"
                      disabled={!p.canAddToCart}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(p.slug, p.packUnit, {
                          item_id: p.sku,
                          item_name: p.title,
                          price: p.priceQuote?.netUnit,
                        });
                        setMiniCartOpen(true);
                      }}
                      aria-label={`Añadir ${p.title} al carrito`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-on-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-tertiary"
                    >
                      <PlusIcon size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={onViewAll}
            className="mt-1 block w-full border-t border-border-subtle px-2 py-2.5 text-left text-xs font-semibold text-text-brand"
          >
            Ver todos los resultados para «{query}» →
          </button>
        </div>
      )}
    </>
  );
}

export function countSuggestOptions(products: SuggestProduct[], categories: SuggestCategory[]): number {
  return categories.length + products.length;
}
