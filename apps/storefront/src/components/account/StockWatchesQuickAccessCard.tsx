import Link from "next/link";

import { ACCOUNT_STOCK_WATCHES_NAV } from "@/lib/account/navigation";
import { Card } from "@/components/ui/Card";

export function StockWatchesQuickAccessCard() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">{ACCOUNT_STOCK_WATCHES_NAV.label}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Consulta las referencias que has marcado con el icono de corazón en el catálogo.
      </p>
      <Link
        href={ACCOUNT_STOCK_WATCHES_NAV.href}
        className="mt-4 inline-block text-sm font-semibold text-text-primary underline"
      >
        Ver avisos de stock
      </Link>
    </Card>
  );
}
