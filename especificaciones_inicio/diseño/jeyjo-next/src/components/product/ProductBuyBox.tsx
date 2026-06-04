"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BoxIcon, HeartIcon } from "@/components/ui/icons";
import { getDualPrice, getPriceView } from "@/lib/utils/price";
import { formatMoney } from "@/lib/utils/format";
import { useUiStore } from "@/lib/store/ui-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { Product } from "@/lib/types";

export function ProductBuyBox({ product }: { product: Product }) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const wishlisted = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const [qty, setQty] = useState(product.packSize);

  const mode = hydrated ? priceMode : "b2c";
  const view = getPriceView(product);
  const dual = getDualPrice(view, mode);
  const onOffer = Boolean(product.offer);

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
        <PriceTag view={view} mode={mode} vat={product.vat} size="xl" />
        {product.packSize > 1 && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded bg-surface px-2.5 py-1.5 text-xs text-text-secondary">
            <BoxIcon size={13} /> Envase cerrado: se vende en cajas de{" "}
            <strong>{product.packSize} unidades</strong>.
          </p>
        )}
      </Card>

      <div className="mt-5">
        <StockBadge stock={product.stock} packSize={product.packSize} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} step={product.packSize} min={product.packSize} />
        <AddToCartButton
          product={product}
          qty={qty}
          size="lg"
          className="flex-1"
          label={`Añadir · ${formatMoney(dual.primary * qty)}`}
        />
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
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
