"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { CartIcon, ChevronLeftIcon, ShieldIcon, TrashIcon, TruckIcon } from "@/components/ui/icons";
import { buildCartSummary } from "@/lib/cart";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

const COUPONS: Record<string, { label: string; percent: number }> = {
  BLOG5: { label: "5% de descuento", percent: 5 },
  MAYO10: { label: "10% descuento mayo", percent: 10 },
};

export default function CartPage() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const priceMode = useUiStore((s) => s.priceMode);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState(false);

  if (!hydrated) {
    return <Container className="py-16" />;
  }

  const summary = buildCartSummary(lines, priceMode);
  const vatNote = priceMode === "b2c" ? "(IVA inc.)" : "(sin IVA)";
  const discount = coupon ? Math.round(summary.subtotal * (coupon.percent / 100) * 100) / 100 : 0;
  const total = Math.round((summary.total - discount) * 100) / 100;

  const applyCoupon = () => {
    const found = COUPONS[couponInput.trim().toUpperCase()];
    if (found) {
      setCoupon({ code: couponInput.trim().toUpperCase(), percent: found.percent });
      setCouponError(false);
    } else {
      setCoupon(null);
      setCouponError(true);
    }
  };

  if (summary.lines.length === 0) {
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
        {/* Lines */}
        <Card className="overflow-hidden">
          {summary.lines.map((line) => (
            <div
              key={line.product.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border-subtle p-5 last:border-b-0 sm:grid-cols-[1fr_140px_120px_32px]"
            >
              <div className="flex items-center gap-4">
                <ProductImage product={line.product} glyphSize={48} className="h-18 w-18 shrink-0" />
                <div>
                  <Link href={`/p/${line.product.id}`} className="text-sm font-bold leading-snug">
                    {line.product.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                    {line.product.ref} · {line.product.brand}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatMoney(line.unitPrice)} / ud
                    {line.product.packSize > 1 && (
                      <span className="text-text-tertiary"> · envase {line.product.packSize} ud</span>
                    )}
                  </p>
                </div>
              </div>
              <QtyStepper
                value={line.qty}
                onChange={(n) => setQty(line.product.id, n)}
                step={line.product.packSize}
                min={line.product.packSize}
              />
              <span className="text-right text-base font-bold tabular">
                {formatMoney(line.lineTotal)}
              </span>
              <button
                onClick={() => removeItem(line.product.id)}
                aria-label="Quitar"
                className="justify-self-end text-text-tertiary hover:text-danger"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
          <div className="p-5">
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-text-brand">
              <ChevronLeftIcon size={14} /> Seguir comprando
            </Link>
          </div>
        </Card>

        {/* Summary */}
        <aside className="lg:sticky lg:top-[88px]">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-extrabold">Resumen del pedido</h2>

            <label className="text-[13px] font-medium text-text-secondary">¿Tienes un cupón?</label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Ej. BLOG5"
                className="h-9 uppercase"
              />
              <Button variant="secondary" size="sm" onClick={applyCoupon}>
                Aplicar
              </Button>
            </div>
            {couponError && <p className="mt-1 text-xs text-danger-text">Cupón no válido.</p>}
            {coupon && (
              <div className="mt-2 flex items-center justify-between rounded bg-success-soft p-2.5 text-xs font-semibold text-success-text">
                <span>Cupón {coupon.code} aplicado</span>
                <button onClick={() => setCoupon(null)}>Quitar</button>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 text-sm">
              <Row label={`Subtotal ${vatNote}`} value={formatMoney(summary.subtotal)} />
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
                    {summary.shippingCost === 0 && (
                      <Badge tone="success" size="xs">
                        GRATIS
                      </Badge>
                    )}
                  </span>
                }
                value={summary.shippingCost === 0 ? "0,00 €" : formatMoney(summary.shippingCost)}
              />
            </div>

            {summary.shippingCost > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-md bg-info-soft p-3 text-xs text-info-text">
                <TruckIcon size={15} /> Añade {formatMoney(summary.amountToFreeShipping)} más para el
                envío gratis.
              </p>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-border-subtle pt-4">
              <span className="text-[13px] font-semibold">Total</span>
              <span className="text-2xl font-extrabold tracking-tight tabular">{formatMoney(total)}</span>
            </div>

            <Button size="lg" block className="mt-4">
              Tramitar pedido
            </Button>

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
