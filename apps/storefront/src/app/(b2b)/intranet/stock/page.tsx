import type { Metadata } from "next";

import { StockWatchesTable } from "@/components/intranet/StockWatchesTable";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

const PATH = "/intranet/stock";

export const metadata: Metadata = {
  title: "Avisos de stock",
  description: "Referencias que sigues y su disponibilidad actual.",
};

export default async function StockPage() {
  await guardIntranetPage(PATH);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Avisos de stock</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Referencias que sigues desde el catálogo. Recibirás un aviso en el portal y por email cuando
          vuelvan a tener stock disponible.
        </p>
      </div>
      <StockWatchesTable />
    </div>
  );
}
