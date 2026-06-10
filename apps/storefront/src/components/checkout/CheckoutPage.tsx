"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CustomerAddress } from "@jeyjo/database-types";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CHECKOUT_COUPON_STORAGE_KEY } from "@/lib/checkout/coupon";
import { loadCheckoutDraft, saveCheckoutDraft, type CheckoutDraft } from "@/lib/checkout/draft";
import type { CheckoutSegment } from "@/lib/checkout/segment";
import type { DeliveryMethod } from "@/lib/checkout/totals";
import type { CheckoutTotals } from "@/lib/checkout/totals";
import { formatCheckoutDiscountLine } from "@/lib/coupon/validate";
import { useCartSummary } from "@/lib/hooks/useCartSummary";
import { trackBeginCheckout } from "@/lib/analytics/ga4";
import { useCartStore } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { submitRedirectForm } from "@/lib/payments/submit-redirect-form";
import type { PaymentSettings } from "@/lib/payments/settings";
import { formatMoney } from "@/lib/utils/format";
import { AddressForm } from "@/components/account/AddressForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { isQuotesEnabledClient } from "@/lib/quotes/enabled";
import {
  clearUncataloguedRequests,
  loadUncataloguedRequests,
  mergeCustomerNotesWithUncatalogued,
} from "@/lib/checkout/uncatalogued-requests";

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta",
  bizum: "Bizum",
  paypal: "PayPal",
  transfer: "Transferencia bancaria",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "home", label: "Envío a dirección de facturación" },
  { value: "alternate_address", label: "Envío a otra dirección" },
  { value: "pickup_alfaro", label: "Recogida en tienda — Alfaro" },
  { value: "pickup_rincon", label: "Recogida en tienda — Rincón de Soto" },
];

export type CheckoutPageProps = {
  segment: CheckoutSegment;
  isLoggedIn: boolean;
  defaultPaymentMethod: string | null;
  billingLabel: string | null;
  paymentSettings?: PaymentSettings | null;
};

export function CheckoutPage({
  segment,
  isLoggedIn,
  defaultPaymentMethod,
  billingLabel,
  paymentSettings,
}: CheckoutPageProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const { summary, loading } = useCartSummary();

  const initialDraft = loadCheckoutDraft();
  const [step, setStep] = useState<CheckoutDraft["step"]>(initialDraft?.step ?? "delivery");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    initialDraft?.deliveryMethod ?? "home",
  );
  const [alternateAddressId, setAlternateAddressId] = useState<string | null>(
    initialDraft?.alternateAddressId ?? null,
  );
  const [guestEmail, setGuestEmail] = useState(initialDraft?.guestEmail ?? "");
  const [customerNotes, setCustomerNotes] = useState(initialDraft?.customerNotes ?? "");
  const [paymentMethodCode, setPaymentMethodCode] = useState(
    initialDraft?.paymentMethodCode ?? "card",
  );
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [prepareToken, setPrepareToken] = useState<string | null>(null);
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [shippingLine, setShippingLine] = useState<string>("");
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<{ code: string; label: string }[]>([]);
  const beginCheckoutTracked = useRef(false);
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    if (segment !== "b2c") return;
    void fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((body: { methods?: { code: string; label: string }[] }) => {
        const methods = body.methods ?? [];
        setPaymentMethods(methods);
        if (methods.length > 0 && !methods.some((m) => m.code === paymentMethodCode)) {
          setPaymentMethodCode(methods[0]!.code);
        }
      })
      .catch(() => setPaymentMethods([]));
  }, [segment]);

  const readCouponCode = () =>
    typeof window !== "undefined" ? sessionStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY) : null;

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0 && !orderPlacedRef.current) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, router]);

  useEffect(() => {
    if (!hydrated || beginCheckoutTracked.current || summary.lines.length === 0) return;
    beginCheckoutTracked.current = true;
    trackBeginCheckout(
      summary.lines
        .filter((line) => !line.unavailable && line.snapshot)
        .map((line) => ({
          item_id: line.snapshot!.skuErp,
          item_name: line.snapshot!.name,
          price: line.unitPrice,
          quantity: line.qty,
        })),
      summary.total,
    );
  }, [hydrated, summary]);

  const loadAddresses = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/account/addresses");
      if (!res.ok) {
        setAddresses([]);
        return;
      }
      const body = (await res.json()) as { addresses?: CustomerAddress[] };
      setAddresses(body.addresses ?? []);
    } catch {
      setAddresses([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const persistDraft = useCallback(
    (patch: Partial<CheckoutDraft>) => {
      saveCheckoutDraft({
        step,
        deliveryMethod,
        alternateAddressId,
        guestEmail,
        customerNotes,
        paymentMethodCode,
        updatedAt: Date.now(),
        ...patch,
      });
    },
    [step, deliveryMethod, alternateAddressId, guestEmail, customerNotes, paymentMethodCode],
  );

  const selectAlternateAddress = useCallback(
    (id: string) => {
      setAlternateAddressId(id);
      persistDraft({ alternateAddressId: id });
    },
    [persistDraft],
  );

  const handleAddressCreated = useCallback(
    (address?: CustomerAddress) => {
      setShowNewAddressForm(false);
      if (address) {
        setAddresses((prev) => {
          const exists = prev.some((a) => a.id === address.id);
          return exists ? prev : [address, ...prev];
        });
        selectAlternateAddress(address.id);
        return;
      }
      void loadAddresses();
    },
    [loadAddresses, selectAlternateAddress],
  );

  const runPrepare = useCallback(async () => {
    setPrepareError(null);
    const res = await fetch("/api/checkout/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines,
        couponCode: readCouponCode(),
        deliveryMethod,
      }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setPrepareError(body.error ?? "No se pudo calcular el resumen");
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
  }, [hydrated, lines.length, deliveryMethod, runPrepare]);

  const goToReview = async () => {
    if (!isLoggedIn && !guestEmail.trim()) {
      setPrepareError("Indica un email de contacto");
      return;
    }
    if (deliveryMethod === "alternate_address" && !alternateAddressId) {
      setPrepareError("Selecciona o añade una dirección de envío");
      return;
    }
    const ok = await runPrepare();
    if (!ok) return;
    setStep("review");
    persistDraft({ step: "review" });
  };

  const billingSnapshot = () => {
    if (!billingLabel) return null;
    return { label: billingLabel, source: "customers_billing" as const };
  };

  const shippingSnapshot = () => {
    if (deliveryMethod === "pickup_alfaro" || deliveryMethod === "pickup_rincon") {
      return {
        type: deliveryMethod,
        label:
          deliveryMethod === "pickup_alfaro"
            ? "Recogida en tienda — Alfaro"
            : "Recogida en tienda — Rincón de Soto",
      };
    }
    if (deliveryMethod === "alternate_address" && alternateAddressId) {
      const addr = addresses.find((a) => a.id === alternateAddressId);
      if (!addr) return null;
      return {
        addressId: addr.id,
        address_line1: addr.address_line1,
        address_line2: addr.address_line2,
        city: addr.city,
        postal_code: addr.postal_code,
        country: addr.country,
        recipient_name: addr.recipient_name,
      };
    }
    return billingSnapshot();
  };

  const placeOrder = async () => {
    if (!prepareToken) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const res = await fetch("/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prepareToken,
          deliveryMethod,
          paymentMethodCode: segment === "b2c" ? paymentMethodCode : undefined,
          guestEmail: isLoggedIn ? null : guestEmail.trim(),
          customerNotes:
            mergeCustomerNotesWithUncatalogued(
              customerNotes.trim(),
              loadUncataloguedRequests(),
            ) || null,
          billingAddressSnapshot: billingSnapshot(),
          shippingAddressSnapshot: shippingSnapshot(),
          alternateAddressId,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        orderNumber?: string;
        orderId?: number;
        nextStep?: {
          type: string;
          provider?: string;
          url?: string;
          path?: string;
          form?: { action: string; fields: Record<string, string> };
        };
      };
      if (!res.ok) throw new Error(body.error ?? "Error al confirmar");

      orderPlacedRef.current = true;

      const orderNumber = body.orderNumber ?? "";
      const next = body.nextStep;

      if (next?.type === "redirect" && next.form) {
        clearCart();
        clearUncataloguedRequests();
        sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
        sessionStorage.removeItem("jeyjo-checkout-draft");
        submitRedirectForm(next.form.action, next.form.fields);
        return;
      }
      if (next?.type === "redirect" && next.url) {
        clearCart();
        clearUncataloguedRequests();
        sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
        sessionStorage.removeItem("jeyjo-checkout-draft");
        window.location.href = next.url;
        return;
      }
      if (next?.type === "instructions" && next.path) {
        clearCart();
        clearUncataloguedRequests();
        sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
        sessionStorage.removeItem("jeyjo-checkout-draft");
        router.push(next.path);
        return;
      }
      if (next?.type === "wallet") {
        orderPlacedRef.current = false;
        setPlaceError(
          "Apple Pay y Google Pay requieren configuración InSite en Redsys. Usa tarjeta o Bizum.",
        );
        return;
      }

      router.push(`/checkout/confirmacion?order=${encodeURIComponent(orderNumber)}`);
      clearCart();
      clearUncataloguedRequests();
      sessionStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
      sessionStorage.removeItem("jeyjo-checkout-draft");
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated || (lines.length === 0 && !orderPlacedRef.current)) {
    return (
      <Container className="py-16">
        <div className="h-32 animate-pulse rounded-lg bg-surface-muted" aria-hidden />
      </Container>
    );
  }

  if (orderPlacedRef.current) {
    return (
      <Container className="py-16">
        <p className="text-center text-text-secondary">Redirigiendo al resumen del pedido…</p>
      </Container>
    );
  }

  const vatNote = segment === "b2c" ? "(IVA inc.)" : "(sin IVA)";

  const confirmButtonLabel = (() => {
    if (placing) return "Confirmando…";
    if (segment !== "b2c") return "Confirmar pedido";
    switch (paymentMethodCode) {
      case "card":
        return "Pagar con tarjeta";
      case "bizum":
        return "Pagar con Bizum";
      case "paypal":
        return "Continuar con PayPal";
      case "apple_pay":
        return "Pagar con Apple Pay";
      case "google_pay":
        return "Pagar con Google Pay";
      case "transfer":
        return "Confirmar pedido";
      default:
        return "Confirmar pedido";
    }
  })();

  return (
    <Container className="pt-6 pb-12">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Carrito", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Checkout</h1>

      <div className="mt-2 flex gap-2 text-sm font-semibold">
        <span className={step === "delivery" ? "text-text-brand" : "text-text-tertiary"}>
          1. Entrega
        </span>
        <span className="text-text-tertiary">→</span>
        <span className={step === "review" ? "text-text-brand" : "text-text-tertiary"}>
          2. Revisión y pago
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "delivery" && (
            <div className="space-y-6">
              <Card className="space-y-4 p-6">
                <h2 className="text-lg font-extrabold">Entrega</h2>
                {!isLoggedIn && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Email *</label>
                    <Input
                      type="email"
                      className="mt-1"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        persistDraft({ guestEmail: e.target.value });
                      }}
                      required
                    />
                  </div>
                )}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-text-secondary">
                    Método de entrega
                  </legend>
                  {DELIVERY_OPTIONS.filter(
                    (opt) => isLoggedIn || opt.value !== "alternate_address",
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle p-3 text-sm has-[:checked]:border-text-brand has-[:checked]:bg-primary-soft"
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === opt.value}
                        onChange={() => {
                          setDeliveryMethod(opt.value);
                          persistDraft({ deliveryMethod: opt.value });
                          if (opt.value !== "alternate_address") {
                            setShowNewAddressForm(false);
                          } else if (addresses.length === 0) {
                            setShowNewAddressForm(true);
                          }
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </fieldset>
                {deliveryMethod !== "home" && deliveryMethod !== "alternate_address" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">
                        Observaciones (opcional)
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                        maxLength={500}
                        rows={3}
                        value={customerNotes}
                        onChange={(e) => {
                          setCustomerNotes(e.target.value);
                          persistDraft({ customerNotes: e.target.value });
                        }}
                      />
                    </div>
                    {prepareError && <p className="text-sm text-danger-text">{prepareError}</p>}
                    <Button size="lg" onClick={() => void goToReview()}>
                      Continuar a revisión
                    </Button>
                  </>
                )}
              </Card>

              {(deliveryMethod === "home" || deliveryMethod === "alternate_address") && (
                <Card className="space-y-4 p-6">
                  <h2 className="text-lg font-extrabold">Dirección de envío</h2>
                  {deliveryMethod === "home" && (
                    <>
                      {billingLabel ? (
                        <div className="rounded-md border border-border-subtle p-3 text-sm">
                          <p className="font-medium">{billingLabel}</p>
                          <p className="mt-1 text-text-secondary">
                            Se enviará a tu dirección de facturación.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-text-secondary">
                          No hay dirección de facturación registrada en tu cuenta.
                        </p>
                      )}
                    </>
                  )}
                  {deliveryMethod === "alternate_address" && isLoggedIn && (
                    <div className="space-y-3">
                      {addresses.length === 0 && !showNewAddressForm ? (
                        <p className="text-sm text-text-secondary">
                          No tienes direcciones guardadas. Añade una nueva para continuar.
                        </p>
                      ) : (
                        addresses.map((addr) => (
                          <label
                            key={addr.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md border border-border-subtle p-3 text-sm has-[:checked]:border-text-brand has-[:checked]:bg-primary-soft"
                          >
                            <input
                              type="radio"
                              name="altAddress"
                              checked={alternateAddressId === addr.id}
                              onChange={() => selectAlternateAddress(addr.id)}
                            />
                            <span>
                              {addr.label || "Dirección"} — {addr.address_line1}, {addr.postal_code}{" "}
                              {addr.city}
                            </span>
                          </label>
                        ))
                      )}
                      {showNewAddressForm ? (
                        <div className="rounded-md border border-border-subtle p-4">
                          <AddressForm
                            title="Nueva dirección de envío"
                            showDefaultOption={false}
                            submitLabel="Usar esta dirección"
                            onCreated={handleAddressCreated}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            className="mt-3"
                            onClick={() => setShowNewAddressForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => setShowNewAddressForm(true)}
                        >
                          Añadir nueva dirección
                        </Button>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-text-secondary">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                      maxLength={500}
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => {
                        setCustomerNotes(e.target.value);
                        persistDraft({ customerNotes: e.target.value });
                      }}
                    />
                  </div>
                  {prepareError && <p className="text-sm text-danger-text">{prepareError}</p>}
                  <Button size="lg" onClick={() => void goToReview()}>
                    Continuar a revisión
                  </Button>
                </Card>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              <Card className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-extrabold">Revisión del pedido</h2>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setStep("delivery")}>
                    Volver a entrega
                  </Button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-text-tertiary">
                      <th className="pb-2 font-medium">Producto</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.lines
                      .filter((l) => !l.unavailable && l.snapshot)
                      .map((l) => (
                        <tr key={l.lineId} className="border-b border-border-subtle">
                          <td className="py-2.5">
                            {l.snapshot?.name} × {l.qty}
                          </td>
                          <td className="py-2.5 text-right tabular">{formatMoney(l.lineTotal)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Card>

              <Card className="space-y-4 p-6">
                {segment === "b2c" ? (
                  <PaymentMethodSelector
                    methods={
                      paymentMethods.length > 0
                        ? paymentMethods
                        : Object.entries(PAYMENT_LABELS).map(([code, label]) => ({ code, label }))
                    }
                    value={paymentMethodCode}
                    onChange={(code) => {
                      setPaymentMethodCode(code);
                      persistDraft({ paymentMethodCode: code });
                    }}
                    applePayEnabled={paymentSettings?.applePayEnabled}
                    googlePayEnabled={paymentSettings?.googlePayEnabled}
                    disabled={placing}
                  />
                ) : (
                  <div>
                    <h2 className="text-lg font-extrabold">Forma de pago acordada</h2>
                    <div className="mt-4 rounded-md bg-surface-muted p-4 text-sm">
                      <p className="font-semibold text-text">
                        {defaultPaymentMethod || "Condiciones de pago según contrato"}
                      </p>
                      <p className="mt-2 text-xs text-text-tertiary">
                        Confirmación sujeta a condiciones de pago acordadas. No se ofrecen pasarelas
                        inmediatas en pedidos B2B.
                      </p>
                    </div>
                  </div>
                )}
                {placeError && <p className="text-sm text-danger-text">{placeError}</p>}
                <Button size="lg" disabled={placing || !prepareToken} onClick={() => void placeOrder()}>
                  {confirmButtonLabel}
                </Button>
                {isQuotesEnabledClient() && (
                  <Button variant="secondary" size="lg" className="mt-2 w-full" asChild>
                    <Link href="/presupuesto">Solicitar presupuesto</Link>
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>

        <aside>
          <Card className="p-6">
            <h2 className="text-lg font-extrabold">Resumen</h2>
            {loading || (!totals && !prepareError) ? (
              <p className="mt-4 text-sm text-text-tertiary">Calculando…</p>
            ) : prepareError && !totals ? (
              <p className="mt-4 text-sm text-danger-text">{prepareError}</p>
            ) : totals ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal {vatNote}</span>
                  <span className="font-semibold tabular">{formatMoney(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-success-text">
                    <span>
                      {formatCheckoutDiscountLine(totals.couponCode, totals.couponLabel)}
                    </span>
                    <span className="font-semibold tabular">-{formatMoney(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Envío</span>
                  <span className="font-semibold">{shippingLine || formatMoney(totals.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-3 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-extrabold tabular">{formatMoney(totals.total)}</span>
                </div>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>
    </Container>
  );
}
