"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { PriceQuote } from "@jeyjo/pricing";

import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockIndicatorBadge } from "@/components/ui/StockBadge";
import { formatMoney } from "@/lib/utils/format";
import { getDualPrice, getPriceViewFromQuote } from "@/lib/utils/price";
import { plpRowToProduct } from "@/lib/plp/row-to-product";
import type { PlpProductRow } from "@/lib/plp/types";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { PublicStockIndicator } from "@/lib/stock/types";

interface QuickViewDialogProps {
  row: PlpProductRow | null;
  quote: PriceQuote | null;
  stock: PublicStockIndicator | null;
  onClose: () => void;
}

export function QuickViewDialog({ row, quote, stock, onClose }: QuickViewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (row) {
      setQty(row.packUnit);
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [row]);

  if (!mounted || !row) return null;

  const product = plpRowToProduct(row, quote ?? undefined);
  const mode = hydrated ? priceMode : "b2c";
  const dual = quote
    ? getDualPrice(getPriceViewFromQuote(quote), mode)
    : { primary: 0, primaryLabel: "", secondary: 0, secondaryLabel: "" };
  const canAdd =
    stock &&
    (stock.level === "available" ||
      stock.level === "low" ||
      stock.allowOrderWithoutStock);

  const stepQty = (delta: number) => {
    setQty((q) => Math.max(row.packUnit, q + delta * row.packUnit));
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[200] m-0 w-[min(calc(100%-2rem),28rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40"
      onClose={onClose}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] text-text-tertiary">
              {row.brand ? `${row.brand} · ` : ""}{row.sku}
            </p>
            <h2 className="text-lg font-bold leading-snug">{row.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-text-tertiary hover:text-text"
            aria-label="Cerrar vista rápida"
          >
            ✕
          </button>
        </div>

        <ProductImage
          product={product}
          imageUrl={row.imageUrl ?? undefined}
          glyphSize={120}
          className="mx-auto mb-4"
        />

        {quote && (
          <div className="mb-3">
            <p className="text-xl font-extrabold">{formatMoney(dual.primary)}</p>
            <p className="text-[11px] text-text-tertiary">
              {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {quote.vatRate}%
            </p>
          </div>
        )}

        {stock && <StockIndicatorBadge indicator={stock} packSize={row.packUnit} className="mb-4" />}

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-border"
            onClick={() => stepQty(-1)}
            aria-label="Reducir cantidad"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center font-semibold">{qty}</span>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-border"
            onClick={() => stepQty(1)}
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            disabled={!canAdd}
            onClick={() => {
              addItem(row.slug, qty);
              setMiniCartOpen(true);
              onClose();
            }}
          >
            Añadir al carrito
          </Button>
          <Button variant="secondary" className="flex-1" asChild>
            <Link href={`/p/${row.slug}`} onClick={onClose}>
              Ver ficha
            </Link>
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
