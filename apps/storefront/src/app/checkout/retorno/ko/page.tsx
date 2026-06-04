"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitRedirectForm } from "@/lib/payments/submit-redirect-form";

function KoContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order")?.trim() ?? "";
  const error = params.get("error");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const retryPayment = async () => {
    if (!orderNumber) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch("/api/payments/redsys/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, method: "card" }),
      });
      const body = (await res.json()) as {
        error?: string;
        tpvUrl?: string;
        merchantParameters?: string;
        signature?: string;
        signatureVersion?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "No se pudo reintentar");
      if (body.tpvUrl && body.merchantParameters && body.signature && body.signatureVersion) {
        submitRedirectForm(body.tpvUrl, {
          Ds_SignatureVersion: body.signatureVersion,
          Ds_MerchantParameters: body.merchantParameters,
          Ds_Signature: body.signature,
        });
        return;
      }
      throw new Error("Respuesta de pago incompleta");
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Error al reintentar");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-extrabold text-danger-text">Pago no completado</h1>
        {orderNumber && (
          <p className="mt-3 text-text-secondary">
            Pedido: <strong className="text-ink">{orderNumber}</strong>
          </p>
        )}
        {error === "signature" && (
          <p className="mt-2 text-sm text-danger-text">No se pudo verificar la respuesta del banco.</p>
        )}
        <p className="mt-4 text-sm text-text-secondary">
          Puedes reintentar el pago sin crear un pedido nuevo.
        </p>
        {retryError && <p className="mt-2 text-sm text-danger-text">{retryError}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderNumber && (
            <Button size="lg" disabled={retrying} onClick={() => void retryPayment()}>
              {retrying ? "Redirigiendo…" : "Reintentar pago"}
            </Button>
          )}
          <Button size="lg" variant="secondary" asChild>
            <Link href="/checkout">Volver al checkout</Link>
          </Button>
        </div>
      </Card>
    </Container>
  );
}

export default function CheckoutRetornoKoPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="mx-auto h-40 max-w-lg animate-pulse rounded-lg bg-surface-muted" />
        </Container>
      }
    >
      <KoContent />
    </Suspense>
  );
}
