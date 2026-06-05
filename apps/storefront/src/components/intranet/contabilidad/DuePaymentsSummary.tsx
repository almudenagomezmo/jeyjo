"use client";

import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/format";

export function DuePaymentsSummary({ total }: { total: number }) {
  return (
    <Card className="flex flex-col gap-1 border-l-4 border-l-primary p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Saldo pendiente total
        </p>
        <p className="text-2xl font-extrabold text-text-primary">{formatMoney(total)}</p>
      </div>
      <p className="text-xs text-text-secondary">
        Facturas con saldo pendiente ordenadas por vencimiento
      </p>
    </Card>
  );
}
