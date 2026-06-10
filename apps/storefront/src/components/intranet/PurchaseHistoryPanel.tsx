"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { orderStatusLabel } from "@/lib/orders/customer-order-labels";
import {
  PURCHASE_HISTORY_STATUS_OPTIONS,
  orderStatusTone,
  purchaseHistoryInclusionNotice,
} from "@/lib/orders/purchase-history-status";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";

type HistoryLine = {
  sku: string;
  usualQty: number;
  lastPurchasedAt: string;
  historicalUnitPrice: number | null;
  lastOrderStatus: string | null;
  lastOrderNumber: string | null;
  lastOrderId: number | null;
  productSlug: string | null;
  name: string;
  imageUrl: string | null;
  canRepeat: boolean;
  currentQuote: { netUnit: number; grossUnit: number; appliedRule: string; label?: string } | null;
};

type HistoryResponse = {
  lines: HistoryLine[];
  total: number;
  page: number;
  pageSize: number;
  departments: string[];
};

type Filters = {
  from: string;
  to: string;
  sku: string;
  department: string;
  status: string;
};

const emptyFilters: Filters = { from: "", to: "", sku: "", department: "", status: "" };

export function PurchaseHistoryPanel() {
  const addItems = useCartStore((s) => s.addItems);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [repeating, setRepeating] = useState(false);

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(p), pageSize: "25" });
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
    if (f.sku) params.set("sku", f.sku);
    if (f.department) params.set("department", f.department);
    if (f.status) params.set("status", f.status);
    try {
      const res = await fetch(`/api/intranet/purchase-history?${params}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Sesión expirada" : "No se pudo cargar el histórico");
        setData(null);
        return;
      }
      const json = (await res.json()) as HistoryResponse;
      setData(json);
      setSelected(new Set());
    } catch {
      setError("Error de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(applied, page);
  }, [applied, page, load]);

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
  };

  const toggleSku = (sku: string, enabled: boolean) => {
    if (!enabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const repeatSelected = async () => {
    if (!data || selected.size === 0) return;
    setRepeating(true);
    setToast(null);
    const items = data.lines
      .filter((l) => selected.has(l.sku) && l.canRepeat)
      .map((l) => ({ sku: l.sku, qty: l.usualQty }));
    try {
      const res = await fetch("/api/intranet/purchase-history/repeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const body = (await res.json()) as {
        additions?: Array<{ productId: string; qty: number }>;
        error?: string;
      };
      if (!res.ok || !body.additions?.length) {
        setToast(body.error ?? "No se pudieron añadir los artículos");
        return;
      }
      addItems(body.additions.map((a) => ({ productId: a.productId, qty: a.qty })));
      setMiniCartOpen(true);
      setToast(
        "Artículos añadidos al carrito. Puedes añadir observaciones en el checkout antes de confirmar.",
      );
      setSelected(new Set());
    } catch {
      setToast("Error al repetir el pedido");
    } finally {
      setRepeating(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Histórico de pedidos</h1>
        <p className="mt-1 text-sm text-text-secondary">Datos histórico — precios mostrados al día de hoy</p>
      </div>

      <Card className="border border-info-text/25 bg-info-soft p-4 text-sm text-text-primary">
        <p className="font-semibold">Pedidos incluidos en este histórico</p>
        <p className="mt-1 text-text-secondary">{purchaseHistoryInclusionNotice()}</p>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Desde</span>
            <input
              type="date"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Hasta</span>
            <input
              type="date"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Referencia</span>
            <input
              type="text"
              placeholder="REF-010"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={filters.sku}
              onChange={(e) => setFilters((f) => ({ ...f, sku: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Estado del pedido</span>
            <select
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Todos</option>
              {PURCHASE_HISTORY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {data && data.departments.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-secondary">Departamento / sede</span>
              <select
                className="rounded-md border border-border bg-surface px-3 py-2"
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              >
                <option value="">Todos</option>
                {data.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={applyFilters}>
            Aplicar filtros
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFilters(emptyFilters);
              setApplied(emptyFilters);
              setPage(1);
            }}
          >
            Limpiar
          </Button>
        </div>
      </Card>

      {toast ? (
        <Card className="border-accent/30 bg-accent/5 p-4 text-sm text-text-primary">{toast}</Card>
      ) : null}

      {error ? (
        <Card className="p-8 text-center text-text-secondary">{error}</Card>
      ) : loading ? (
        <Card className="p-8 text-center text-text-secondary">Cargando histórico…</Card>
      ) : !data?.lines.length ? (
        <Card className="p-8 text-center text-text-secondary">
          No hay compras en el periodo seleccionado.
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-text-secondary">
                <tr>
                  <th className="w-10 p-3" />
                  <th className="p-3">Artículo</th>
                  <th className="p-3">Cant. habitual</th>
                  <th className="p-3">Última compra</th>
                  <th className="p-3">Estado pedido</th>
                  <th className="p-3">Precio</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => (
                  <HistoryRow
                    key={line.sku}
                    line={line}
                    checked={selected.has(line.sku)}
                    onToggle={() => toggleSku(line.sku, line.canRepeat)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {data.lines.map((line) => (
              <HistoryCard
                key={line.sku}
                line={line}
                checked={selected.has(line.sku)}
                onToggle={() => toggleSku(line.sku, line.canRepeat)}
              />
            ))}
          </div>
        </>
      )}

      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Página {data.page} de {totalPages} ({data.total} líneas)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="sticky bottom-4 z-10 flex justify-center">
          <Card className="flex flex-wrap items-center gap-3 border-accent/40 p-4 shadow-lg">
            <span className="text-sm font-medium">{selected.size} seleccionados</span>
            <Button type="button" disabled={repeating} onClick={() => void repeatSelected()}>
              Añadir al carrito
            </Button>
            <Link href="/cart" className="text-sm text-accent underline-offset-2 hover:underline">
              Ver carrito
            </Link>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-text-secondary">Histórico ERP</span>;
  }
  return (
    <Badge tone={orderStatusTone(status)} size="xs">
      {orderStatusLabel(status)}
    </Badge>
  );
}

function LastOrderStatusCell({ line }: { line: HistoryLine }) {
  return (
    <div className="flex flex-col gap-1">
      <OrderStatusBadge status={line.lastOrderStatus} />
      {line.lastOrderNumber && line.lastOrderId ? (
        <Link
          href={`/cuenta/pedidos/${line.lastOrderId}`}
          className="text-xs text-text-brand hover:underline"
        >
          {line.lastOrderNumber}
        </Link>
      ) : null}
    </div>
  );
}

function PriceCell({ line }: { line: HistoryLine }) {
  const current = line.currentQuote?.netUnit;
  const historical = line.historicalUnitPrice;
  const showHistorical =
    current != null && historical != null && Math.abs(current - historical) >= 0.01;

  return (
    <div className="flex flex-col gap-0.5">
      {current != null ? (
        <span className="font-semibold text-text-primary">
          {formatMoney(current)}{" "}
          <span className="text-xs font-normal text-accent">(Precio actual)</span>
        </span>
      ) : (
        <span className="text-text-secondary">Precio no disponible</span>
      )}
      {showHistorical ? (
        <span className="text-xs text-text-secondary line-through">{formatMoney(historical)}</span>
      ) : null}
    </div>
  );
}

function HistoryRow({
  line,
  checked,
  onToggle,
}: {
  line: HistoryLine;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={!line.canRepeat}
          title={line.canRepeat ? undefined : "No disponible en catálogo"}
          onChange={onToggle}
          aria-label={`Seleccionar ${line.sku}`}
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
            {line.imageUrl ? (
              <Image src={line.imageUrl} alt="" fill className="object-contain p-1" sizes="64px" />
            ) : null}
          </div>
          <div>
            <p className="font-medium text-text-primary">{line.name}</p>
            <p className="text-xs text-text-secondary">{line.sku}</p>
          </div>
        </div>
      </td>
      <td className="p-3">{line.usualQty}</td>
      <td className="p-3 text-text-secondary">{line.lastPurchasedAt}</td>
      <td className="p-3">
        <LastOrderStatusCell line={line} />
      </td>
      <td className="p-3">
        <PriceCell line={line} />
      </td>
    </tr>
  );
}

function HistoryCard({
  line,
  checked,
  onToggle,
}: {
  line: HistoryLine;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={!line.canRepeat}
          onChange={onToggle}
          className="mt-1"
          aria-label={`Seleccionar ${line.sku}`}
        />
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
          {line.imageUrl ? (
            <Image src={line.imageUrl} alt="" fill className="object-contain p-1" sizes="80px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{line.name}</p>
          <p className="text-xs text-text-secondary">{line.sku}</p>
          <p className="mt-2 text-sm text-text-secondary">
            Cant. habitual: {line.usualQty} · {line.lastPurchasedAt}
          </p>
          <div className="mt-2">
            <LastOrderStatusCell line={line} />
          </div>
          <div className="mt-2">
            <PriceCell line={line} />
          </div>
        </div>
      </div>
    </Card>
  );
}
