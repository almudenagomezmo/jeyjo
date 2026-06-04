"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function ConfirmacionContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order")?.trim();
  const paid = params.get("paid") === "1";

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-extrabold">
          {paid ? "Pago confirmado" : "Pedido recibido"}
        </h1>
        {orderNumber ? (
          <p className="mt-3 text-text-secondary">
            Número de pedido: <strong className="text-ink">{orderNumber}</strong>
          </p>
        ) : (
          <p className="mt-3 text-text-secondary">Tu pedido se ha registrado correctamente.</p>
        )}
        <p className="mt-2 text-sm text-text-tertiary">
          {paid
            ? "Tu pago se ha autorizado correctamente. Recibirás la confirmación por email cuando esté disponible."
            : "Si elegiste transferencia, completa el pago con las instrucciones indicadas. El email de confirmación llegará en una próxima versión."}
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/">Seguir comprando</Link>
        </Button>
      </Card>
    </Container>
  );
}

export default function CheckoutConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="mx-auto h-40 max-w-lg animate-pulse rounded-lg bg-surface-muted" />
        </Container>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
