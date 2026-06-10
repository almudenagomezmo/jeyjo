"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CustomerOrderLine } from "@/lib/orders/parse-order-line-snapshots";
import { formatCheckoutDiscountLine } from "@/lib/coupon/validate";
import { formatMoney } from "@/lib/utils/format";

type ConfirmacionClientProps = {
  orderNumber: string | null;
  paid: boolean;
  statusLabel: string;
  deliveryLabel: string;
  paymentMethodLabel: string | null;
  couponCode: string | null;
  couponLabel: string | null;
  couponDiscount: number;
  lines: CustomerOrderLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  customerNotes: string | null;
};

export function ConfirmacionClient({
  orderNumber,
  paid,
  statusLabel,
  deliveryLabel,
  paymentMethodLabel,
  couponCode,
  couponLabel,
  couponDiscount,
  lines,
  subtotal,
  shippingCost,
  total,
  customerNotes,
}: ConfirmacionClientProps) {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-8 text-center">
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
              : "Hemos registrado tu pedido. Si elegiste transferencia, completa el pago con las instrucciones indicadas."}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Estado
            </p>
            <p className="mt-1 font-semibold">{statusLabel}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Entrega
            </p>
            <p className="mt-1 font-semibold">{deliveryLabel}</p>
          </Card>
          {paymentMethodLabel && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Forma de pago
              </p>
              <p className="mt-1 font-semibold">{paymentMethodLabel}</p>
            </Card>
          )}
          {couponCode && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Cupón aplicado
              </p>
              <p className="mt-1 font-semibold">{couponCode}</p>
              {couponLabel && (
                <p className="mt-0.5 text-sm text-text-secondary">{couponLabel}</p>
              )}
            </Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <h2 className="font-extrabold">Resumen del pedido</h2>
          </div>
          {lines.length === 0 ? (
            <p className="p-6 text-sm text-text-secondary">Sin líneas de producto registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Referencia</th>
                    <th className="px-4 py-3 font-semibold text-right">Cant.</th>
                    <th className="px-4 py-3 font-semibold text-right">Precio</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr
                      key={`${line.lineId ?? line.skuErp}-${line.qty}`}
                      className="border-t border-border-subtle"
                    >
                      <td className="px-4 py-3">{line.name}</td>
                      <td className="px-4 py-3 text-text-secondary tabular">{line.skuErp}</td>
                      <td className="px-4 py-3 text-right tabular">{line.qty}</td>
                      <td className="px-4 py-3 text-right tabular">{formatMoney(line.unitPrice)}</td>
                      <td className="px-4 py-3 text-right tabular font-semibold">
                        {formatMoney(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Subtotal</dt>
              <dd className="font-semibold tabular">{formatMoney(subtotal)}</dd>
            </div>
            {couponCode && couponDiscount > 0 && (
              <div className="flex justify-between text-success-text">
                <dt>{formatCheckoutDiscountLine(couponCode, couponLabel)}</dt>
                <dd className="font-semibold tabular">-{formatMoney(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-secondary">Envío</dt>
              <dd className="font-semibold tabular">
                {shippingCost > 0 ? formatMoney(shippingCost) : "Gratis"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="text-xl font-extrabold tabular">{formatMoney(total)}</dd>
            </div>
          </dl>
        </Card>

        {customerNotes?.trim() && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Observaciones
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
              {customerNotes.trim()}
            </p>
          </Card>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
