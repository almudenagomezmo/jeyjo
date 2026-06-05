"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Ga4Item } from "@/lib/analytics/ga4";
import { formatMoney } from "@/lib/utils/format";

type ConfirmacionClientProps = {
  orderNumber: string | null;
  paid: boolean;
  lineItems: Ga4Item[];
  total?: number;
};

export function ConfirmacionClient({
  orderNumber,
  paid,
  lineItems,
  total,
}: ConfirmacionClientProps) {
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
        {lineItems.length > 0 && (
          <ul className="mt-4 space-y-1 text-left text-sm text-text-secondary">
            {lineItems.map((item) => (
              <li key={`${item.item_id}-${item.quantity}`}>
                {item.item_name ?? item.item_id} × {item.quantity ?? 1}
              </li>
            ))}
          </ul>
        )}
        {total != null && total > 0 && (
          <p className="mt-3 text-sm font-semibold text-ink">Total: {formatMoney(total)}</p>
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
