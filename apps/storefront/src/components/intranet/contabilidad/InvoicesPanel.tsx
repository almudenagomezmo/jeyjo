"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DocumentFilters,
} from "@/components/intranet/contabilidad/DocumentFilters";
import {
  DocumentTable,
  PdfDownloadLink,
  formatDocumentDate,
  type DocumentColumn,
} from "@/components/intranet/contabilidad/DocumentTable";
import { formatMoney } from "@/lib/utils/format";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  netAmount: number;
  grossAmount: number;
};

export function InvoicesPanel() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [query, setQuery] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [applied, setApplied] = useState({ year: "", month: "", query: "", amountMin: "", amountMax: "" });
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (filters: typeof applied) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.year) params.set("year", filters.year);
    if (filters.month) params.set("month", filters.month);
    if (filters.query) params.set("q", filters.query);
    if (filters.amountMin) params.set("amountMin", filters.amountMin);
    if (filters.amountMax) params.set("amountMax", filters.amountMax);

    try {
      const res = await fetch(`/api/intranet/documents/invoices?${params}`);
      if (!res.ok) {
        setError(res.status === 403 ? "Sin permiso financiero" : "No se pudieron cargar las facturas");
        setRows([]);
        return;
      }
      const data = (await res.json()) as { items?: InvoiceRow[] };
      setRows(data.items ?? []);
    } catch {
      setError("Error de red");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(applied);
  }, [applied, load]);

  const columns: DocumentColumn<InvoiceRow>[] = [
    { key: "number", header: "Nº factura", cell: (r) => r.invoiceNumber },
    { key: "date", header: "Fecha", cell: (r) => formatDocumentDate(r.issuedAt) },
    { key: "net", header: "Sin IVA", cell: (r) => formatMoney(r.netAmount) },
    { key: "gross", header: "Con IVA", cell: (r) => formatMoney(r.grossAmount) },
    {
      key: "pdf",
      header: "Descarga",
      cell: (r) => <PdfDownloadLink href={`/api/intranet/documents/invoices/${r.id}/pdf`} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Facturas emitidas</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Facturas a cliente actualizadas de los últimos 5 años sincronizadas desde Avansuite
        </p>
      </div>

      <DocumentFilters
        year={year}
        month={month}
        query={query}
        amountMin={amountMin}
        amountMax={amountMax}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onQueryChange={setQuery}
        onAmountMinChange={setAmountMin}
        onAmountMaxChange={setAmountMax}
        onApply={() => setApplied({ year, month, query, amountMin, amountMax })}
        onReset={() => {
          setYear("");
          setMonth("");
          setQuery("");
          setAmountMin("");
          setAmountMax("");
          setApplied({ year: "", month: "", query: "", amountMin: "", amountMax: "" });
        }}
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <DocumentTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyMessage="No hay facturas que coincidan con los filtros seleccionados."
      />
    </div>
  );
}
