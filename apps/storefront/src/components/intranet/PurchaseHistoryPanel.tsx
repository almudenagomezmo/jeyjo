"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";
import { orderStatusLabel } from "@/lib/orders/customer-order-labels";
import {
  PURCHASE_HISTORY_STATUS_OPTIONS,
  orderStatusTone,
  purchaseHistoryInclusionNotice,
} from "@/lib/orders/purchase-history-status";
import { formatMoney, formatOrderDateTime } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";

type HistoryLine = {
  sku: string;
  qty: number;
  historicalUnitPrice: number | null;
  productSlug: string | null;
  name: string;
  imageUrl: string | null;
  canRepeat: boolean;
  currentQuote: { netUnit: number; grossUnit: number; appliedRule: string; label?: string } | null;
};

type HistoryOrder = {
  orderKey: string;
  orderId: number | null;
  orderNumber: string | null;
  orderStatus: string | null;
  purchasedAt: string;
  department: string | null;
  lines: HistoryLine[];
};

type HistoryResponse = {
  orders: HistoryOrder[];
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

function lineKey(orderKey: string, sku: string): string {
  return `${orderKey}::${sku}`;
}

function repeatableLines(order: HistoryOrder): HistoryLine[] {
  return order.lines.filter((line) => line.canRepeat);
}

type PurchaseHistoryPanelProps = {
  title?: string;
  subtitle?: string;
  apiBase?: string;
};

export function PurchaseHistoryPanel({
  title = "Histórico de pedidos",
  subtitle = "Datos histórico — precios mostrados al día de hoy",
  apiBase = "/api/intranet/purchase-history",
}: PurchaseHistoryPanelProps = {}) {
  const addItems = useCartStore((s) => s.addItems);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
      const res = await fetch(`${apiBase}?${params}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Sesión expirada" : "No se pudo cargar el histórico");
        setData(null);
        return;
      }
      const json = (await res.json()) as HistoryResponse;
      setData(json);
      setSelected(new Set());
      setExpanded(new Set());
    } catch {
      setError("Error de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load(applied, page);
  }, [applied, page, load]);

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
  };

  const toggleExpanded = (orderKey: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderKey)) next.delete(orderKey);
      else next.add(orderKey);
      return next;
    });
  };

  const toggleLine = (order: HistoryOrder, line: HistoryLine) => {
    if (!line.canRepeat) return;
    const key = lineKey(order.orderKey, line.sku);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleOrderSelection = (order: HistoryOrder) => {
    const repeatable = repeatableLines(order);
    if (repeatable.length === 0) return;
    const keys = repeatable.map((line) => lineKey(order.orderKey, line.sku));
    const allSelected = keys.every((key) => selected.has(key));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const key of keys) next.delete(key);
      } else {
        for (const key of keys) next.add(key);
      }
      return next;
    });
  };

  const repeatItems = async (items: Array<{ sku: string; qty: number }>) => {
    if (items.length === 0) return;
    setRepeating(true);
    setToast(null);
    try {
      const res = await fetch(`${apiBase}/repeat`, {
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

  const repeatSelected = async () => {
    if (!data || selected.size === 0) return;
    const items: Array<{ sku: string; qty: number }> = [];
    for (const order of data.orders) {
      for (const line of order.lines) {
        if (selected.has(lineKey(order.orderKey, line.sku)) && line.canRepeat) {
          items.push({ sku: line.sku, qty: line.qty });
        }
      }
    }
    await repeatItems(items);
  };

  const repeatOrder = async (order: HistoryOrder) => {
    const items = repeatableLines(order).map((line) => ({ sku: line.sku, qty: line.qty }));
    await repeatItems(items);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
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
      ) : !data?.orders.length ? (
        <Card className="p-8 text-center text-text-secondary">
          No hay compras en el periodo seleccionado.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.orders.map((order) => (
            <OrderCard
              key={order.orderKey}
              order={order}
              expanded={expanded.has(order.orderKey)}
              selected={selected}
              repeating={repeating}
              onToggleExpand={() => toggleExpanded(order.orderKey)}
              onToggleLine={(line) => toggleLine(order, line)}
              onToggleOrderSelection={() => toggleOrderSelection(order)}
              onRepeatOrder={() => void repeatOrder(order)}
            />
          ))}
        </div>
      )}

      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Página {data.page} de {totalPages} ({data.total} pedidos)
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

function OrderCard({
  order,
  expanded,
  selected,
  repeating,
  onToggleExpand,
  onToggleLine,
  onToggleOrderSelection,
  onRepeatOrder,
}: {
  order: HistoryOrder;
  expanded: boolean;
  selected: Set<string>;
  repeating: boolean;
  onToggleExpand: () => void;
  onToggleLine: (line: HistoryLine) => void;
  onToggleOrderSelection: () => void;
  onRepeatOrder: () => void;
}) {
  const repeatable = repeatableLines(order);
  const repeatableKeys = repeatable.map((line) => lineKey(order.orderKey, line.sku));
  const allRepeatableSelected =
    repeatableKeys.length > 0 && repeatableKeys.every((key) => selected.has(key));
  const someRepeatableSelected = repeatableKeys.some((key) => selected.has(key));
  const formattedDate = formatOrderDateTime(order.purchasedAt);
  const orderLabel =
    order.orderNumber ??
    (order.orderId ? String(order.orderId) : `Compra ${formattedDate || order.purchasedAt}`);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex shrink-0 items-center justify-center rounded-md p-1 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar artículos" : "Mostrar artículos"}
        >
          {expanded ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
        </button>

        {repeatable.length > 0 ? (
          <input
            type="checkbox"
            checked={allRepeatableSelected}
            ref={(el) => {
              if (el) el.indeterminate = someRepeatableSelected && !allRepeatableSelected;
            }}
            onChange={onToggleOrderSelection}
            aria-label={`Seleccionar todos los artículos de ${orderLabel}`}
            className="shrink-0"
          />
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {order.orderId ? (
              <Link
                href={`/cuenta/pedidos/${order.orderId}`}
                className="font-semibold text-text-brand hover:underline"
              >
                {orderLabel}
              </Link>
            ) : (
              <span className="font-semibold text-text-primary">{orderLabel}</span>
            )}
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {formattedDate || order.purchasedAt}
            {order.department ? ` · ${order.department}` : ""}
            {` · ${order.lines.length} artículo${order.lines.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {repeatable.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={repeating}
            onClick={onRepeatOrder}
          >
            Añadir pedido al carrito
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-text-secondary">
                <tr>
                  <th className="w-10 p-3" />
                  <th className="p-3">Artículo</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <HistoryRow
                    key={line.sku}
                    line={line}
                    checked={selected.has(lineKey(order.orderKey, line.sku))}
                    onToggle={() => onToggleLine(line)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 p-4 md:hidden">
            {order.lines.map((line) => (
              <HistoryLineCard
                key={line.sku}
                line={line}
                checked={selected.has(lineKey(order.orderKey, line.sku))}
                onToggle={() => onToggleLine(line)}
              />
            ))}
          </div>
        </>
      ) : null}
    </Card>
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
      <td className="p-3">{line.qty}</td>
      <td className="p-3">
        <PriceCell line={line} />
      </td>
    </tr>
  );
}

function HistoryLineCard({
  line,
  checked,
  onToggle,
}: {
  line: HistoryLine;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border p-3">
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
        <p className="mt-2 text-sm text-text-secondary">Cantidad: {line.qty}</p>
        <div className="mt-2">
          <PriceCell line={line} />
        </div>
      </div>
    </div>
  );
}
