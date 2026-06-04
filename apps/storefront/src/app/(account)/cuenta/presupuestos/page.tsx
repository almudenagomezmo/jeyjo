import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { fetchCustomerQuotes } from "@/lib/quotes/payload-quote";
import { isQuotesEnabled } from "@/lib/quotes/enabled";
import { formatMoney } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  in_review: "En revisión",
  sent: "Enviado",
  accepted: "Aceptado",
  ordered: "Pedido",
  cancelled: "Cancelado",
};

export const metadata: Metadata = { title: "Mis presupuestos" };

export default async function AccountQuotesPage() {
  if (!isQuotesEnabled()) {
    redirect("/cuenta");
  }

  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/presupuestos");

  const quotes = await fetchCustomerQuotes(ctx.customerId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Mis presupuestos</h1>
      {quotes.length === 0 ? (
        <Card className="p-8 text-center text-text-secondary">
          <p>No tienes presupuestos solicitados.</p>
          <p className="mt-2 text-sm">
            Añade productos al carrito y usa <strong>Solicitar presupuesto</strong> cuando lo necesites.
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
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-medium tabular">{q.quoteNumber ?? q.id}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(q.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    {q.status ? (STATUS_LABELS[q.status] ?? q.status) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular font-semibold">
                    {q.amount != null ? formatMoney(q.amount) : "—"}
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
