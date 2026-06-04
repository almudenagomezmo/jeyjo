"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";

function PayPalReturnContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNumber = params.get("order")?.trim() ?? "";
  const paypalOrderId = params.get("token")?.trim();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber || !paypalOrderId) {
      setError("Parámetros de PayPal incompletos");
      return;
    }
    void fetch("/api/payments/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, paypalOrderId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Capture failed");
        }
        router.replace(
          `/checkout/confirmacion?order=${encodeURIComponent(orderNumber)}&paid=1`,
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error PayPal");
      });
  }, [orderNumber, paypalOrderId, router]);

  return (
    <Container className="py-12">
      <p className="text-center text-text-secondary">
        {error ?? "Confirmando pago con PayPal…"}
      </p>
    </Container>
  );
}

export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="mx-auto h-24 max-w-lg animate-pulse rounded-lg bg-surface-muted" />
        </Container>
      }
    >
      <PayPalReturnContent />
    </Suspense>
  );
}
