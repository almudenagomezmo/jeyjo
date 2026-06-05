"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DocumentTable,
  PdfDownloadLink,
  formatDocumentDate,
  formatDocumentDateOnly,
  type DocumentColumn,
} from "@/components/intranet/contabilidad/DocumentTable";
import { formatMoney } from "@/lib/utils/format";

type ErpQuoteRow = {
  id: string;
  quoteNumber: string;
  issuedAt: string;
  validUntil: string;
  grossAmount: number;
  status: "active" | "expired";
};

export function ErpQuotesPanel() {
  const [rows, setRows] = useState<ErpQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/documents/erp-quotes");
      if (!res.ok) {
        setError("No se pudieron cargar los presupuestos");
        return;
      }
      const data = (await res.json()) as { items?: ErpQuoteRow[] };
      setRows(data.items ?? []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: DocumentColumn<ErpQuoteRow>[] = [
    { key: "number", header: "Presupuesto", cell: (r) => r.quoteNumber },
    { key: "issued", header: "Emisión", cell: (r) => formatDocumentDate(r.issuedAt) },
    { key: "valid", header: "Válido hasta", cell: (r) => formatDocumentDateOnly(r.validUntil) },
    { key: "amount", header: "Importe", cell: (r) => formatMoney(r.grossAmount) },
    {
      key: "status",
      header: "Estado",
      cell: (r) => (
        <span
          className={
            r.status === "expired"
              ? "rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text-secondary"
              : "rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-text-brand"
          }
        >
          {r.status === "expired" ? "Caducado" : "Vigente"}
        </span>
      ),
    },
    {
      key: "pdf",
      header: "Descarga",
      cell: (r) => <PdfDownloadLink href={`/api/intranet/documents/erp-quotes/${r.id}/pdf`} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Presupuestos ERP</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Presupuestos vigentes y caducados emitidos por Jeyjo desde Avansuite
        </p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <DocumentTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} />
    </div>
  );
}
