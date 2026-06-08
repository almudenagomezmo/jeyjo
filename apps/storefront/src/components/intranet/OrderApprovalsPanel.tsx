"use client";

import { useCallback, useEffect, useState } from "react";

import type { PendingApprovalOrder } from "@/lib/intranet/order-approvals";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function OrderApprovalsPanel() {
  const [orders, setOrders] = useState<PendingApprovalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/order-approvals");
      if (!res.ok) throw new Error("No se pudo cargar la cola de aprobación");
      const data = (await res.json()) as { orders: PendingApprovalOrder[] };
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(orderId: number, action: "approve" | "reject") {
    setBusyId(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/intranet/order-approvals/${orderId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "No se pudo procesar el pedido");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-text-secondary">Cargando pedidos pendientes…</p>;
  }

  if (orders.length === 0) {
    return (
      <Card className="p-4 text-sm text-text-secondary">
        No hay pedidos pendientes de aprobación de empresa.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">{error}</div>
      )}
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{order.orderNumber}</p>
            <p className="text-sm text-text-secondary">
              {order.submittedByEmail ?? "Subusuario"} · {order.amount.toFixed(2)} €
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busyId === order.id}
              onClick={() => handleAction(order.id, "approve")}
            >
              Aprobar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyId === order.id}
              onClick={() => handleAction(order.id, "reject")}
            >
              Rechazar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function OrderApprovalsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Card className="border-primary/30 bg-primary-soft p-4">
      <p className="font-semibold text-text-brand">
        {count} pedido{count === 1 ? "" : "s"} pendiente{count === 1 ? "" : "s"} de tu aprobación
      </p>
      <a href="/cuenta/empresa/preferencias#aprobaciones" className="mt-2 inline-block text-sm font-semibold underline">
        Revisar cola de aprobación
      </a>
    </Card>
  );
}
