"use client";

import { useState } from "react";
import type { PriceQuote } from "@jeyjo/pricing";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockIndicatorBadge } from "@/components/ui/StockBadge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { PackQtyStepper } from "@/components/product/PackQtyStepper";
import { BoxIcon, HeartIcon } from "@/components/ui/icons";
import { getDualPrice, getPriceViewFromQuote } from "@/lib/utils/price";
import { formatMoney } from "@/lib/utils/format";
import { useUiStore } from "@/lib/store/ui-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { PublicStockIndicator } from "@/lib/stock/types";

const BACKORDER_MESSAGE =
  "El pedido queda pendiente de validación por comprobación de stock de la referencia";

export function ProductBuyBox({
  productId,
  sku,
  refLabel,
  packUnit,
  quote,
  stock,
  vatRate,
}: {
  /** Canonical slug stored in cart lines. */
  productId: string;
  sku: string;
  refLabel: string;
  packUnit: number;
  quote: PriceQuote;
  stock: PublicStockIndicator;
  vatRate: number;
}) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const wishlisted = useWishlistStore((s) => s.ids.includes(sku));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const [qty, setQty] = useState(packUnit > 0 ? packUnit : 1);
  const [backorderNotice, setBackorderNotice] = useState(false);

  const mode = hydrated ? priceMode : "b2c";
  const view = getPriceViewFromQuote(quote);
  const dual = getDualPrice(view, mode);
  const onOffer =
    quote.listUnit != null && quote.listUnit > quote.netUnit;

  const canAdd =
    stock.level === "available" ||
    stock.level === "low" ||
    stock.allowOrderWithoutStock;

  const cartStock = canAdd ? 100 : 0;

  return (
    <div>
      <Card
        className="border-0 p-5"
        style={{ background: onOffer ? "var(--primary-soft)" : "var(--surface-subtle)" }}
      >
        {onOffer && (
          <Badge tone="danger" size="sm" className="mb-2">
            Oferta limitada
          </Badge>
        )}
        <PriceTag view={view} mode={mode} vat={vatRate} size="xl" />
        {packUnit > 1 && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded bg-surface px-2.5 py-1.5 text-xs text-text-secondary">
            <BoxIcon size={13} /> Envase cerrado: se vende en cajas de{" "}
            <strong>{packUnit} unidades</strong>.
          </p>
        )}
      </Card>

      <div className="mt-5">
        <StockIndicatorBadge indicator={stock} packSize={packUnit} />
      </div>

      {backorderNotice && (
        <p className="mt-3 rounded-md bg-surface-subtle px-3 py-2 text-xs text-text-secondary" role="status">
          {BACKORDER_MESSAGE} {refLabel}.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <PackQtyStepper packUnit={packUnit} value={qty} onChange={setQty} />
        <AddToCartButton
          product={{ id: productId, packSize: packUnit, stock: cartStock }}
          qty={qty}
          size="lg"
          className="flex-1"
          disabled={!canAdd}
          label={
            !canAdd
              ? "Sin stock"
              : `Añadir · ${formatMoney(dual.primary * qty)}`
          }
          onAdded={() => {
            if (stock.level === "limited" && stock.allowOrderWithoutStock) {
              setBackorderNotice(true);
            }
          }}
        />
        <button
          type="button"
          onClick={() => toggleWishlist(sku)}
          aria-label="Añadir a favoritos"
          aria-pressed={wishlisted}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border text-text-secondary"
        >
          <HeartIcon
            size={18}
            fill={hydrated && wishlisted ? "currentColor" : "none"}
            className={hydrated && wishlisted ? "text-danger" : undefined}
          />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-md bg-surface-subtle p-4">
        <Bullet title="Envío gratis +39 €" sub="Llega en 24-48 h" />
        <Bullet title="Devolución 14 días" sub="RMA online" />
        <Bullet title="Pago seguro" sub="Redsys · Bizum · PayPal" />
        <Bullet title="Factura empresa" sub="Disponible para B2B" />
      </div>
    </div>
  );
}

function Bullet({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <p className="text-xs font-bold">{title}</p>
      <p className="text-[11px] text-text-tertiary">{sub}</p>
    </div>
  );
}
