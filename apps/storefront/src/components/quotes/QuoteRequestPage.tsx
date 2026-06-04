"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CHECKOUT_COUPON_STORAGE_KEY } from "@/lib/checkout/coupon";
import type { CheckoutSegment } from "@/lib/checkout/segment";
import type { CheckoutTotals, DeliveryMethod } from "@/lib/checkout/totals";
import { useCartSummary } from "@/lib/hooks/useCartSummary";
import { useCartStore } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { formatMoney } from "@/lib/utils/format";

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "home", label: "Envío a dirección de facturación" },
  { value: "alternate_address", label: "Envío a otra dirección guardada" },
  { value: "pickup_alfaro", label: "Recogida en tienda — Alfaro" },
  { value: "pickup_rincon", label: "Recogida en tienda — Rincón de Soto" },
];

export type QuoteRequestPageProps = {
  segment: CheckoutSegment;
  isLoggedIn: boolean;
  billingLabel: string | null;
  contactEmail: string | null;
};

export function QuoteRequestPage({
  segment,
  isLoggedIn,
  billingLabel,
  contactEmail,
}: QuoteRequestPageProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const { loading } = useCartSummary();

  const [step, setStep] = useState<"delivery" | "review">("delivery");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home");
  const [guestEmail, setGuestEmail] = useState(contactEmail ?? "");
  const [customerNotes, setCustomerNotes] = useState("");
  const [prepareToken, setPrepareToken] = useState<string | null>(null);
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [shippingLine, setShippingLine] = useState("");
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  const readCouponCode = () =>
    typeof window !== "undefined" ? sessionStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY) : null;

  const runPrepare = useCallback(async () => {
    setPrepareError(null);
    const res = await fetch("/api/quotes/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines,
        couponCode: readCouponCode(),
        deliveryMethod,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setPrepareError(body.error ?? "No se pudo calcular el presupuesto");
      return false;
    }
    const body = (await res.json()) as {
      prepareToken: string;
      totals: CheckoutTotals;
      shippingLine: string;
    };
    setPrepareToken(body.prepareToken);
    setTotals(body.totals);
    setShippingLine(body.shippingLine);
    return true;
  }, [lines, deliveryMethod]);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    void runPrepare();
  }, [hydrated, lines.length, runPrepare]);

  const goToReview = async () => {
    if (!isLoggedIn && !guestEmail.trim()) {
      setPrepareError("Indica un email de contacto");
      return;
    }
    const ok = await runPrepare();
    if (ok) setStep("review");
  };

  const submitQuote = async () => {
    if (!prepareToken) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/quotes/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prepareToken,
        deliveryMethod,
        guestEmail: isLoggedIn ? null : guestEmail.trim(),
        customerNotes: customerNotes.trim() || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(body.error ?? "No se pudo solicitar el presupuesto");
      return;
    }
    const body = (await res.json()) as { quoteNumber: string };
    clearCart();
    router.push(`/presupuesto/confirmacion?ref=${encodeURIComponent(body.quoteNumber)}`);
  };

  const vatNote = segment === "b2b" ? "(sin IVA)" : "(IVA incl.)";

  if (!hydrated) {
    return (
      <Container className="py-10">
        <p className="text-text-secondary">Cargando…</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Carrito", href: "/cart" },
          { label: "Solicitar presupuesto" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Solicitar presupuesto</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Obtén un precio formal antes de confirmar tu pedido. No se realizará ningún cargo.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {step === "delivery" && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-extrabold">Entrega y contacto</h2>
              {!isLoggedIn && (
                <div>
                  <label className="text-sm font-semibold" htmlFor="guest-email">
                    Email de contacto *
                  </label>
                  <Input
                    id="guest-email"
                    type="email"
                    className="mt-1"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              {isLoggedIn && billingLabel && (
                <p className="text-sm text-text-secondary">
                  Facturación: <span className="text-text-primary">{billingLabel}</span>
                </p>
              )}
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Método de entrega</legend>
                {DELIVERY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === opt.value}
                      onChange={() => setDeliveryMethod(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </fieldset>
              <div>
                <label className="text-sm font-semibold" htmlFor="notes">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="notes"
                  className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>
              {prepareError && <p className="text-sm text-danger-text">{prepareError}</p>}
              <Button onClick={() => void goToReview()}>Revisar presupuesto</Button>
            </Card>
          )}

          {step === "review" && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-extrabold">Revisión</h2>
              <p className="text-sm text-text-secondary">
                Al enviar la solicitud recibirás un email con el número de presupuesto asignado.
              </p>
              {submitError && <p className="text-sm text-danger-text">{submitError}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep("delivery")}>
                  Volver
                </Button>
                <Button size="lg" disabled={submitting || !prepareToken} onClick={() => void submitQuote()}>
                  {submitting ? "Enviando…" : "Solicitar presupuesto"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        <aside>
          <Card className="p-6">
            <h2 className="text-lg font-extrabold">Resumen</h2>
            {loading || !totals ? (
              <p className="mt-4 text-sm text-text-tertiary">Calculando…</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal {vatNote}</span>
                  <span className="font-semibold tabular">{formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Envío</span>
                  <span className="font-semibold">{shippingLine || formatMoney(totals.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-3 text-base">
                  <span className="font-semibold">Total estimado</span>
                  <span className="text-xl font-extrabold tabular">{formatMoney(totals.total)}</span>
                </div>
              </div>
            )}
            <p className="mt-4 text-xs text-text-tertiary">
              ¿Prefieres comprar ya?{" "}
              <Link href="/checkout" className="text-text-brand underline">
                Tramitar pedido
              </Link>
            </p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
