"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { CartIcon, CloseIcon, TruckIcon, TrashIcon } from "@/components/ui/icons";
import { buildCartSummary } from "@/lib/cart";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

export function MiniCart() {
  const hydrated = useHydrated();
  const open = useUiStore((s) => s.miniCartOpen);
  const setOpen = useUiStore((s) => s.setMiniCartOpen);
  const priceMode = useUiStore((s) => s.priceMode);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open || !hydrated) return null;

  const summary = buildCartSummary(lines, priceMode);
  const vatNote = priceMode === "b2c" ? "(IVA inc.)" : "(sin IVA)";

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-ink/40"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-[min(96vw,440px)] flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle p-5">
          <div>
            <h2 className="text-base font-bold">Tu carrito</h2>
            <p className="text-xs text-text-tertiary">
              {summary.itemCount} {summary.itemCount === 1 ? "artículo" : "artículos"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-text-tertiary hover:bg-surface-muted"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {summary.lines.length === 0 ? (
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
              {summary.lines.map((line) => (
                <div key={line.product.id} className="flex gap-3 p-2">
                  <ProductImage product={line.product} glyphSize={36} className="h-15 w-15 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/p/${line.product.id}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-[13px] font-semibold leading-snug"
                    >
                      {line.product.name}
                    </Link>
                    <p className="font-mono text-[11px] text-text-tertiary">{line.product.ref}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <QtyStepper
                        value={line.qty}
                        onChange={(n) => setQty(line.product.id, n)}
                        step={line.product.packSize}
                      />
                      <span className="text-sm font-bold tabular">{formatMoney(line.lineTotal)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(line.product.id)}
                    aria-label="Quitar"
                    className="self-start text-text-tertiary hover:text-danger"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border-subtle p-5">
              {summary.shippingCost === 0 ? (
                <p className="mb-3 flex items-center gap-2 rounded-md bg-success-soft p-3 text-[13px] text-success-text">
                  <TruckIcon size={16} /> Tu pedido tiene <strong>envío gratis</strong>.
                </p>
              ) : (
                <p className="mb-3 flex items-center gap-2 rounded-md bg-info-soft p-3 text-[13px] text-info-text">
                  <TruckIcon size={16} /> Te faltan {formatMoney(summary.amountToFreeShipping)} para
                  el envío gratis.
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Subtotal {vatNote}</span>
                <span className="font-bold">{formatMoney(summary.subtotal)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" asChild>
                  <Link href="/cart" onClick={() => setOpen(false)}>
                    Ver carrito
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/cart" onClick={() => setOpen(false)}>
                    Tramitar
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
