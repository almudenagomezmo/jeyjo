"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Container } from "@/components/layout/Container";
import { CartRecoverHandler } from "@/components/cart/CartRecoverHandler";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { PackQtyStepper } from "@/components/product/PackQtyStepper";
import { CartIcon, ChevronLeftIcon, ShieldIcon, TrashIcon, TruckIcon } from "@/components/ui/icons";
import { cartSnapshotToGlyphProduct } from "@/lib/cart/to-glyph-product";
import { formatMoney } from "@/lib/utils/format";
import { CHECKOUT_COUPON_STORAGE_KEY } from "@/lib/checkout/coupon";
import { isQuotesEnabledClient } from "@/lib/quotes/enabled";
import { useCartSummary } from "@/lib/hooks/useCartSummary";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

type AppliedCoupon = {
  code: string;
  label: string;
  discountAmount: number;
  showOfferExclusionWarning: boolean;
};

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartRecoverHandler />
      <CartPageContent />
    </Suspense>
  );
}

function CartPageContent() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const priceMode = useUiStore((s) => s.priceMode);
  const { summary, loading, pricedLineCount } = useCartSummary();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  if (!hydrated) {
    return (
      <Container className="py-16">
        <div className="h-32 animate-pulse rounded-lg bg-surface-muted" aria-hidden />
      </Container>
    );
  }

  const vatNote = priceMode === "b2c" ? "(IVA inc.)" : "(sin IVA)";
  const discount = coupon?.discountAmount ?? 0;
  const merchandiseSubtotal = Math.round((summary.subtotal - discount) * 100) / 100;
  const shippingCost =
    merchandiseSubtotal >= summary.shippingThreshold ? 0 : summary.shippingCost;
  const total = Math.round((merchandiseSubtotal + shippingCost) * 100) / 100;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, lines }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        code?: string;
        label?: string;
        discountAmount?: number;
        showOfferExclusionWarning?: boolean;
        message?: string;
      };
      if (!res.ok || !data.valid) {
        setCoupon(null);
        setCouponError(data.message ?? "Cupón no válido.");
        sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
        return;
      }
      const applied: AppliedCoupon = {
        code: data.code ?? code.toUpperCase(),
        label: data.label ?? code,
        discountAmount: data.discountAmount ?? 0,
        showOfferExclusionWarning: data.showOfferExclusionWarning ?? false,
      };
      setCoupon(applied);
      sessionStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, applied.code);
    } catch {
      setCouponError("No se pudo validar el cupón.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
    setCouponInput("");
    sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
  };

  if (lines.length === 0) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-12 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-text-tertiary">
            <CartIcon size={28} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">Tu carrito está vacío</h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            Cuando añadas productos, los verás aquí.
          </p>
          <Button size="lg" className="mt-5" asChild>
            <Link href="/">Ver catálogo</Link>
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pt-6">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Carrito" }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        Tu carrito{" "}
        <span className="text-lg font-medium text-text-tertiary">
          · {summary.itemCount} {summary.itemCount === 1 ? "artículo" : "artículos"}
        </span>
      </h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          {loading && pricedLineCount === 0 ? (
            <div className="p-8">
              <div className="h-24 animate-pulse rounded-lg bg-surface-muted" aria-hidden />
            </div>
          ) : (
            summary.lines.map((line) => {
              if (line.unavailable || !line.snapshot) {
                return (
                  <div
                    key={line.lineId}
                    className="flex items-center justify-between gap-4 border-b border-border-subtle p-5"
                  >
                    <div>
                      <p className="text-sm font-bold">Producto no disponible</p>
                      <p className="text-xs text-text-tertiary">Cantidad: {line.qty}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.lineId)}
                      aria-label="Quitar"
                      className="text-text-tertiary hover:text-danger"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                );
              }

              const snap = line.snapshot;
              return (
                <div
                  key={line.lineId}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border-subtle p-5 last:border-b-0 sm:grid-cols-[1fr_160px_120px_32px]"
                >
                  <div className="flex items-center gap-4">
                    <ProductImage
                      product={cartSnapshotToGlyphProduct(snap)}
                      imageUrl={snap.imageUrl}
                      glyphSize={48}
                      className="h-18 w-18 shrink-0"
                      alt={snap.name}
                    />
                    <div>
                      <Link href={`/p/${snap.slug}`} className="text-sm font-bold leading-snug">
                        {snap.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                        {snap.ref} · {snap.brand}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatMoney(line.unitPrice)} / ud
                        {snap.packUnit > 1 && (
                          <span className="text-text-tertiary">
                            {" "}
                            · envase {snap.packUnit} ud
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <PackQtyStepper
                    packUnit={snap.packUnit}
                    value={line.qty}
                    onChange={(n) => setQty(line.lineId, n)}
                  />
                  <span className="text-right text-base font-bold tabular">
                    {formatMoney(line.lineTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(line.lineId)}
                    aria-label="Quitar"
                    className="justify-self-end text-text-tertiary hover:text-danger"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              );
            })
          )}
          <div className="p-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-text-brand"
            >
              <ChevronLeftIcon size={14} /> Seguir comprando
            </Link>
          </div>
        </Card>

        <aside className="lg:sticky lg:top-[88px]">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-extrabold">Resumen del pedido</h2>

            <label className="text-[13px] font-medium text-text-secondary">
              ¿Tienes un cupón?
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Ej. BLOG5"
                className="h-9 uppercase"
              />
              <Button variant="secondary" size="sm" onClick={() => void applyCoupon()} disabled={couponLoading}>
                {couponLoading ? "…" : "Aplicar"}
              </Button>
            </div>
            {couponError && <p className="mt-1 text-xs text-danger-text">{couponError}</p>}
            {coupon?.showOfferExclusionWarning && (
              <p className="mt-1 text-xs text-warning-text">
                El cupón no aplica sobre artículos en oferta
              </p>
            )}
            {coupon && (
              <div className="mt-2 flex items-center justify-between rounded bg-success-soft p-2.5 text-xs font-semibold text-success-text">
                <span>
                  Cupón {coupon.code} — {coupon.label}
                </span>
                <button type="button" onClick={removeCoupon}>
                  Quitar
                </button>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 text-sm">
              <Row
                label={`Subtotal ${vatNote}`}
                value={loading ? "…" : formatMoney(summary.subtotal)}
              />
              {coupon && (
                <Row
                  label={`Descuento (${coupon.code})`}
                  value={`-${formatMoney(discount)}`}
                  highlight
                />
              )}
              <Row
                label={
                  <span className="inline-flex items-center gap-1.5">
                    Envío
                    {shippingCost === 0 && merchandiseSubtotal > 0 && (
                      <Badge tone="success" size="xs">
                        GRATIS
                      </Badge>
                    )}
                  </span>
                }
                value={shippingCost === 0 ? "0,00 €" : formatMoney(shippingCost)}
              />
            </div>

            {shippingCost === 0 && merchandiseSubtotal > 0 ? (
              <p className="mt-3 flex items-center gap-2 rounded-md bg-success-soft p-3 text-xs text-success-text">
                <TruckIcon size={15} /> Tu pedido tiene envío gratis.
              </p>
            ) : shippingCost > 0 ? (
              <p className="mt-3 flex items-center gap-2 rounded-md bg-info-soft p-3 text-xs text-info-text">
                <TruckIcon size={15} /> Añade {formatMoney(summary.amountToFreeShipping)} más para
                el envío gratis.
              </p>
            ) : null}

            <div className="mt-4 flex items-baseline justify-between border-t border-border-subtle pt-4">
              <span className="text-[13px] font-semibold">Total</span>
              <span className="text-2xl font-extrabold tracking-tight tabular">
                {loading ? "…" : formatMoney(total)}
              </span>
            </div>

            <Button size="lg" block className="mt-4" asChild>
              <Link href="/checkout">Tramitar pedido</Link>
            </Button>

            <Button variant="secondary" block className="mt-2" asChild={isQuotesEnabledClient() && lines.length > 0} disabled={!isQuotesEnabledClient() || lines.length === 0}>
              {isQuotesEnabledClient() && lines.length > 0 ? (
                <Link href="/presupuesto">Solicitar presupuesto</Link>
              ) : (
                <span>Solicitar presupuesto</span>
              )}
            </Button>
            {!isQuotesEnabledClient() && (
              <p className="mt-1 text-center text-[11px] text-text-tertiary">
                Presupuesto B2B disponible próximamente
              </p>
            )}

            <p className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
              <ShieldIcon size={14} className="text-text-brand" /> Pago seguro con cifrado TLS 1.3
            </p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: React.ReactNode;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={highlight ? "text-success-text" : "text-text-secondary"}>{label}</span>
      <span className={highlight ? "font-semibold text-success-text" : "font-semibold tabular"}>
        {value}
      </span>
    </div>
  );
}
