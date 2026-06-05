import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StockWatchesTable } from "@/components/intranet/StockWatchesTable";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = {
  title: "Avisos de stock",
  description: "Referencias que sigues desde el catálogo.",
};

export default async function AccountStockWatchesPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/avisos-stock");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Avisos de stock</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Referencias que sigues desde el catálogo. Marca productos con el icono de corazón cuando
          quieras guardarlos o recibir aviso si vuelven a tener stock.
        </p>
      </div>
      <StockWatchesTable apiPath="/api/account/stock-watches" />
    </div>
  );
}
