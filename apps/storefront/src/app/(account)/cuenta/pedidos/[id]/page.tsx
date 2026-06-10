import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";
import {
  orderDeliveryLabel,
  orderStatusLabel,
} from "@/lib/orders/customer-order-labels";
import { formatCheckoutDiscountLine } from "@/lib/coupon/validate";
import { fetchCustomerWebOrderDetail } from "@/lib/orders/fetch-customer-orders";
import { resolveOrderCouponSummary } from "@/lib/orders/order-coupon-summary";
import { parseCustomerOrderLines } from "@/lib/orders/parse-order-line-snapshots";
import { formatMoney } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);
  if (!Number.isFinite(orderId)) return { title: "Pedido" };

  const ctx = await getCustomerContext();
  if (!ctx) return { title: "Pedido" };

  const order = await fetchCustomerWebOrderDetail(ctx.customerId, orderId);
  return {
    title: order?.orderNumber ? `Pedido ${order.orderNumber}` : "Pedido",
  };
}

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/pedidos");

  const { id } = await params;
  const orderId = Number.parseInt(id, 10);
  if (!Number.isFinite(orderId)) notFound();

  const order = await fetchCustomerWebOrderDetail(ctx.customerId, orderId);
  if (!order) notFound();

  const lines = parseCustomerOrderLines(order.orderLineSnapshots);
  const merchandiseSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingCost = order.shippingCost ?? 0;
  const total = order.amount ?? merchandiseSubtotal + shippingCost;
  const { couponCode, couponLabel, couponDiscount } = await resolveOrderCouponSummary({
    couponCode: order.couponCode,
    linesSubtotal: merchandiseSubtotal,
    shippingCost,
    orderTotal: total,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/cuenta/pedidos"
          className="text-sm font-semibold text-text-brand hover:underline"
        >
          ← Volver a mis pedidos
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          Pedido {order.orderNumber ?? order.id}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Realizado el{" "}
          {new Date(order.createdAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Estado
          </p>
          <p className="mt-1 font-semibold">{orderStatusLabel(order.jeyjoStatus)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Entrega
          </p>
          <p className="mt-1 font-semibold">{orderDeliveryLabel(order)}</p>
        </Card>
        {order.paymentMethodLabel && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Forma de pago
            </p>
            <p className="mt-1 font-semibold">{order.paymentMethodLabel}</p>
          </Card>
        )}
        {couponCode && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Cupón
            </p>
            <p className="mt-1 font-semibold">{couponCode}</p>
            {couponLabel ? (
              <p className="mt-1 text-sm text-text-secondary">{couponLabel}</p>
            ) : null}
            {couponDiscount > 0 ? (
              <p className="mt-1 text-sm font-semibold text-success-text">
                -{formatMoney(couponDiscount)} aplicado
              </p>
            ) : null}
          </Card>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-extrabold">Productos</h2>
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
                  <tr key={`${line.lineId ?? line.skuErp}-${line.qty}`} className="border-t border-border-subtle">
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
            <dd className="font-semibold tabular">{formatMoney(merchandiseSubtotal)}</dd>
          </div>
          {couponCode && couponDiscount > 0 ? (
            <div className="flex justify-between text-success-text">
              <dt>{formatCheckoutDiscountLine(couponCode, couponLabel)}</dt>
              <dd className="font-semibold tabular">-{formatMoney(couponDiscount)}</dd>
            </div>
          ) : null}
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

      {order.customerNotes?.trim() && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Observaciones
          </p>
          <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">
            {order.customerNotes.trim()}
          </p>
        </Card>
      )}
    </div>
  );
}
