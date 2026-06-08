import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";
import {
  orderDeliveryLabel,
  orderStatusLabel,
} from "@/lib/orders/customer-order-labels";
import { fetchCustomerWebOrders } from "@/lib/orders/fetch-customer-orders";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function AccountOrdersPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/pedidos");

  const orders = await fetchCustomerWebOrders(ctx.customerId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Mis pedidos</h1>
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-text-secondary">
          <p>No tienes pedidos web todavía.</p>
          <p className="mt-2 text-sm">
            Cuando confirmes un pedido en la tienda, aparecerá aquí con su estado.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Número</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Entrega</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-medium tabular">
                    <Link
                      href={`/cuenta/pedidos/${order.id}`}
                      className="text-text-brand hover:underline"
                    >
                      {order.orderNumber ?? order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{orderStatusLabel(order.jeyjoStatus)}</td>
                  <td className="px-4 py-3 text-text-secondary">{orderDeliveryLabel(order)}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold">
                    {order.amount != null ? formatMoney(order.amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
