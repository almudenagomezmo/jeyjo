"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DocumentTable,
  PdfDownloadLink,
  formatDocumentDate,
  type DocumentColumn,
} from "@/components/intranet/contabilidad/DocumentTable";

type DeliveryNoteRow = {
  id: string;
  deliveryNoteNumber: string;
  issuedAt: string;
  status: "issued" | "preparing";
};

const STATUS_LABEL: Record<DeliveryNoteRow["status"], string> = {
  issued: "Emitido",
  preparing: "En preparación",
};

export function DeliveryNotesPanel() {
  const [rows, setRows] = useState<DeliveryNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/documents/delivery-notes");
      if (!res.ok) {
        setError("No se pudieron cargar los albaranes");
        setRows([]);
        return;
      }
      const data = (await res.json()) as { items?: DeliveryNoteRow[] };
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

  const columns: DocumentColumn<DeliveryNoteRow>[] = [
    { key: "number", header: "Albarán", cell: (r) => r.deliveryNoteNumber },
    { key: "date", header: "Fecha", cell: (r) => formatDocumentDate(r.issuedAt) },
    { key: "status", header: "Estado", cell: (r) => STATUS_LABEL[r.status] },
    {
      key: "pdf",
      header: "Descarga",
      cell: (r) => <PdfDownloadLink href={`/api/intranet/documents/delivery-notes/${r.id}/pdf`} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Albaranes</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Albaranes emitidos y en preparación sincronizados desde el ERP
        </p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <DocumentTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} />
    </div>
  );
}
