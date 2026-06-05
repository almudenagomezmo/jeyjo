"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

export type DocumentColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DocumentTableProps<T> = {
  columns: DocumentColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  rowClassName?: (row: T) => string | undefined;
};

export function DocumentTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = "No hay documentos para mostrar.",
  rowClassName,
}: DocumentTableProps<T>) {
  if (loading) {
    return <p className="text-sm text-text-secondary">Cargando documentos…</p>;
  }

  if (rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PdfDownloadLink({ href, label = "PDF" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
    >
      {label}
    </a>
  );
}

export function formatDocumentDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES");
}

export function formatDocumentDateOnly(date: string): string {
  const [y, m, day] = date.split("-");
  if (!y || !m || !day) return date;
  return `${day}/${m}/${y}`;
}
