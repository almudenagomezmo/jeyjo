"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { PackQtyStepper } from "@/components/product/PackQtyStepper";
import { CartIcon, CloseIcon, TruckIcon, TrashIcon } from "@/components/ui/icons";
import { cartSnapshotToGlyphProduct } from "@/lib/cart/to-glyph-product";
import { formatMoney } from "@/lib/utils/format";
import { useCartSummary } from "@/lib/hooks/useCartSummary";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

function MiniCartSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 p-2">
          <div className="h-15 w-15 shrink-0 animate-pulse rounded-md bg-surface-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
            <div className="h-8 w-24 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniCart() {
  const hydrated = useHydrated();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const open = useUiStore((s) => s.miniCartOpen);
  const setOpen = useUiStore((s) => s.setMiniCartOpen);
  const priceMode = useUiStore((s) => s.priceMode);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const { summary, loading, isEmpty } = useCartSummary();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open || !hydrated) return null;

  const vatNote = priceMode === "b2c" ? "(IVA inc.)" : "(sin IVA)";
  const showLines = !isEmpty && summary.lines.length > 0;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-ink/40"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-[min(96vw,440px)] flex-col bg-surface shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border-subtle p-5">
          <div>
            <h2 id={titleId} className="text-base font-bold">
              Tu carrito
            </h2>
            <p className="text-xs text-text-tertiary">
              {loading
                ? "Actualizando…"
                : `${summary.itemCount} ${summary.itemCount === 1 ? "artículo" : "artículos"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-text-tertiary hover:bg-surface-muted"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-text-tertiary">
              <CartIcon size={24} />
            </span>
            <p className="font-bold">Tu carrito está vacío</p>
            <p className="text-sm text-text-tertiary">Añade productos para verlos aquí.</p>
            <Button onClick={() => setOpen(false)} className="mt-2">
              Ver catálogo
            </Button>
          </div>
        ) : (
          <>
            <div className="scroll-thin flex-1 overflow-auto p-3">
              {loading && !showLines ? (
                <MiniCartSkeleton />
              ) : (
                summary.lines.map((line) => {
                  if (line.unavailable || !line.snapshot) {
                    return (
                      <div
                        key={line.lineId}
                        className="flex items-start justify-between gap-3 rounded-md bg-surface-muted p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold">Producto no disponible</p>
                          <p className="text-xs text-text-tertiary">
                            Cantidad: {line.qty} · Ya no está en catálogo
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.lineId)}
                          aria-label="Quitar producto no disponible"
                          className="text-text-tertiary hover:text-danger"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    );
                  }

                  const snap = line.snapshot;
                  return (
                    <div key={line.lineId} className="flex gap-3 p-2">
                      <ProductImage
                        product={cartSnapshotToGlyphProduct(snap)}
                        imageUrl={snap.imageUrl}
                        glyphSize={36}
                        className="h-15 w-15 shrink-0"
                        alt={snap.name}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/p/${snap.slug}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-2 text-[13px] font-semibold leading-snug"
                        >
                          {snap.name}
                        </Link>
                        <p className="font-mono text-[11px] text-text-tertiary">{snap.ref}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <PackQtyStepper
                            packUnit={snap.packUnit}
                            value={line.qty}
                            onChange={(n) => setQty(line.lineId, n)}
                          />
                          <span className="text-sm font-bold tabular">
                            {formatMoney(line.lineTotal)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.lineId)}
                        aria-label="Quitar"
                        className="self-start text-text-tertiary hover:text-danger"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {showLines && (
              <div className="border-t border-border-subtle p-5">
                {summary.shippingCost === 0 && summary.subtotal > 0 ? (
                  <p className="mb-3 flex items-center gap-2 rounded-md bg-success-soft p-3 text-[13px] text-success-text">
                    <TruckIcon size={16} /> Tu pedido tiene <strong>envío gratis</strong>.
                  </p>
                ) : summary.shippingCost > 0 ? (
                  <p className="mb-3 flex items-center gap-2 rounded-md bg-info-soft p-3 text-[13px] text-info-text">
                    <TruckIcon size={16} /> Te faltan {formatMoney(summary.amountToFreeShipping)}{" "}
                    para el envío gratis.
                  </p>
                ) : null}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Subtotal {vatNote}</span>
                  <span className="font-bold">
                    {loading ? "…" : formatMoney(summary.subtotal)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" asChild>
                    <Link href="/cart" onClick={() => setOpen(false)}>
                      Ver carrito
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/checkout" onClick={() => setOpen(false)}>
                      Tramitar
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
