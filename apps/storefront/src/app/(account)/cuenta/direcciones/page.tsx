import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = { title: "Direcciones" };

export default async function AccountAddressesPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/direcciones");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Direcciones</h1>
      <Card className="p-8 text-center text-text-secondary">Próximamente</Card>
    </div>
  );
}
