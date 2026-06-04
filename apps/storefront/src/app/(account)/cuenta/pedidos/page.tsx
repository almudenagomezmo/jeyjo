import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function AccountOrdersPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/pedidos");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Mis pedidos</h1>
      <Card className="p-8 text-center text-text-secondary">Próximamente</Card>
    </div>
  );
}
