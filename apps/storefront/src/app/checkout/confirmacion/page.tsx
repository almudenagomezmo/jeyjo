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

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-extrabold">Pedido recibido</h1>
        {orderNumber ? (
          <p className="mt-3 text-text-secondary">
            Número de pedido: <strong className="text-ink">{orderNumber}</strong>
          </p>
        ) : (
          <p className="mt-3 text-text-secondary">Tu pedido se ha registrado correctamente.</p>
        )}
        <p className="mt-2 text-sm text-text-tertiary">
          El pago con pasarela y el email de confirmación llegarán en próximas versiones.
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
