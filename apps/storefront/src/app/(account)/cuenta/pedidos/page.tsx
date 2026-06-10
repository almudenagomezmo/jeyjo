import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PurchaseHistoryPanel } from "@/components/intranet/PurchaseHistoryPanel";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function AccountOrdersPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/pedidos");

  return (
    <PurchaseHistoryPanel
      title="Mis pedidos"
      subtitle="Precios mostrados al día de hoy"
      apiBase="/api/account/purchase-history"
    />
  );
}
