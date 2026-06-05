"use client";

import { useCallback, useEffect, useState } from "react";

import { DuePaymentsSummary } from "@/components/intranet/contabilidad/DuePaymentsSummary";
import {
  DocumentTable,
  formatDocumentDateOnly,
  type DocumentColumn,
} from "@/components/intranet/contabilidad/DocumentTable";
import { formatMoney } from "@/lib/utils/format";

type DuePaymentRow = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  outstandingAmount: number;
  isOverdue: boolean;
};

export function DuePaymentsPanel() {
  const [rows, setRows] = useState<DuePaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/documents/due-payments");
      if (!res.ok) {
        setError("No se pudieron cargar los vencimientos");
        return;
      }
      const data = (await res.json()) as {
        items?: DuePaymentRow[];
        totalOutstandingAmount?: number;
      };
      setRows(data.items ?? []);
      setTotal(data.totalOutstandingAmount ?? 0);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: DocumentColumn<DuePaymentRow>[] = [
    { key: "number", header: "Nº factura", cell: (r) => r.invoiceNumber },
    { key: "invoiceDate", header: "Fecha factura", cell: (r) => formatDocumentDateOnly(r.invoiceDate) },
    { key: "dueDate", header: "Vencimiento", cell: (r) => formatDocumentDateOnly(r.dueDate) },
    { key: "amount", header: "Importe", cell: (r) => formatMoney(r.outstandingAmount) },
    {
      key: "status",
      header: "Estado",
      cell: (r) => (
        <span className={r.isOverdue ? "font-semibold text-danger" : "text-text-secondary"}>
          {r.isOverdue ? "Vencida" : "Pendiente"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Vencimientos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Facturas pendientes de pago con semáforo de vencimiento
        </p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!loading && rows.length > 0 ? <DuePaymentsSummary total={total} /> : null}
      <DocumentTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.invoiceNumber}
        loading={loading}
        rowClassName={(r) => (r.isOverdue ? "bg-danger/5" : undefined)}
        emptyMessage="No tienes facturas con saldo pendiente."
      />
    </div>
  );
}
