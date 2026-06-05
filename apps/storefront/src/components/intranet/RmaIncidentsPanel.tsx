"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  RMA_REASON_OPTIONS,
  rmaReasonLabel,
  rmaStatusLabel,
} from "@/lib/intranet/rma/labels";
import type { CreateRmaInput, RmaIncidentRow, RmaListFilter } from "@/lib/intranet/rma/types";

type ListResponse = {
  incidents: RmaIncidentRow[];
  total: number;
  page: number;
  pageSize: number;
};

const emptyForm: CreateRmaInput = {
  articleSku: "",
  deliveryNoteNumber: "",
  reason: "wrong_item",
  observations: "",
};

const TABS: { id: RmaListFilter; label: string }[] = [
  { id: "open", label: "Abiertas" },
  { id: "closed", label: "Cerradas" },
  { id: "all", label: "Todas" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "authorized":
      return "bg-success/15 text-success";
    case "rejected":
      return "bg-danger/15 text-danger";
    case "in_review":
      return "bg-warning/15 text-warning";
    default:
      return "bg-surface-muted text-text-secondary";
  }
}

export function RmaIncidentsPanel() {
  const [tab, setTab] = useState<RmaListFilter>("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRmaInput>(emptyForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (filter: RmaListFilter, p: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      status: filter,
      page: String(p),
      pageSize: "25",
    });
    try {
      const res = await fetch(`/api/intranet/rma-incidents?${params}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Sesión expirada" : "No se pudo cargar las incidencias");
        setData(null);
        return;
      }
      const json = (await res.json()) as ListResponse;
      setData(json);
    } catch {
      setError("Error de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab, page);
  }, [load, tab, page]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/intranet/rma-incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json().catch(() => ({}))) as {
        rmaNumber?: string
        field?: string
        message?: string
        error?: string
      }
      if (!res.ok) {
        setFieldError(body.message ?? body.error ?? "No se pudo enviar la solicitud");
        return;
      }
      setForm(emptyForm);
      setToast(`Solicitud registrada: ${body.rmaNumber ?? "RMA"}`);
      setTab("open");
      setPage(1);
      void load("open", 1);
    } catch {
      setFieldError("Error de red al enviar");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">RMA e incidencias</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Solicita autorización para devoluciones y consulta el estado de tus incidencias
        </p>
      </div>

      <Card className="border-warning/40 bg-warning/5 p-4 text-sm text-text-primary">
        <p className="font-semibold">Autorización previa obligatoria</p>
        <p className="mt-1 text-text-secondary">
          Ninguna devolución se acepta sin autorización previa de Jeyjo. Envía esta solicitud para
          que nuestro equipo revise tu caso.
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-bold">Nueva solicitud de RMA</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm sm:col-span-1">
            <span className="text-text-secondary">Referencia del artículo</span>
            <input
              type="text"
              required
              placeholder="REF-011"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={form.articleSku}
              onChange={(e) => setForm((f) => ({ ...f, articleSku: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-1">
            <span className="text-text-secondary">Número de albarán</span>
            <input
              type="text"
              required
              placeholder="ALB-2026-001"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={form.deliveryNoteNumber}
              onChange={(e) => setForm((f) => ({ ...f, deliveryNoteNumber: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-text-secondary">Motivo de la devolución</span>
            <select
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value as CreateRmaInput["reason"] }))
              }
            >
              {RMA_REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-text-secondary">Observaciones</span>
            <textarea
              rows={3}
              className="rounded-md border border-border bg-surface px-3 py-2"
              placeholder={
                form.reason === "other"
                  ? "Describe el motivo (mín. 10 caracteres)"
                  : "Opcional"
              }
              value={form.observations ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
            />
          </label>
          {fieldError ? (
            <p className="text-sm text-danger sm:col-span-2">{fieldError}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      </Card>

      {toast ? (
        <Card className="border-accent/30 bg-accent/5 p-4 text-sm text-text-primary">{toast}</Card>
      ) : null}

      <div>
        <div className="flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "border-b-2 border-accent text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <Card className="mt-4 p-8 text-center text-text-secondary">{error}</Card>
        ) : loading ? (
          <Card className="mt-4 p-8 text-center text-text-secondary">Cargando incidencias…</Card>
        ) : !data?.incidents.length ? (
          <Card className="mt-4 p-8 text-center text-text-secondary">
            {tab === "closed"
              ? "No hay incidencias cerradas."
              : "No hay incidencias en esta pestaña."}
          </Card>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-text-secondary">
                  <tr>
                    <th className="p-3">Nº RMA</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Referencia</th>
                    <th className="p-3">Albarán</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.incidents.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="p-3 font-medium tabular-nums">{row.rmaNumber ?? row.id}</td>
                      <td className="p-3 text-text-secondary">
                        {new Date(row.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{row.articleSku}</span>
                        {row.productTitle ? (
                          <span className="mt-0.5 block text-xs text-text-secondary">
                            {row.productTitle}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3">{row.deliveryNoteNumber}</td>
                      <td className="p-3">{rmaReasonLabel(String(row.reason))}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(String(row.status))}`}
                        >
                          {rmaStatusLabel(String(row.status))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:hidden">
              {data.incidents.map((row) => (
                <Card key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold">{row.rmaNumber ?? row.id}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(String(row.status))}`}
                    >
                      {rmaStatusLabel(String(row.status))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {row.articleSku}
                    {row.productTitle ? ` — ${row.productTitle}` : ""}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Albarán {row.deliveryNoteNumber} · {rmaReasonLabel(String(row.reason))}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {new Date(row.createdAt).toLocaleString("es-ES")}
                  </p>
                  {row.observations ? (
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                      {row.observations}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-text-secondary">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
