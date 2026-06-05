"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { StockIndicatorBadge } from "@/components/ui/StockBadge";
import { removeWishlistSku } from "@/lib/wishlist/api-client";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import type { PublicStockIndicator } from "@/lib/stock/types";

type StockWatchItem = {
  id: string;
  sku: string;
  productTitle: string;
  stockIndicator: PublicStockIndicator;
  lastNotifiedAt: string | null;
  createdAt: string;
  href: string;
};

export function StockWatchesTable() {
  const [items, setItems] = useState<StockWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setIds = useWishlistStore((s) => s.setIds);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/stock-watches", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "No se pudieron cargar los avisos");
        return;
      }
      const data = (await res.json()) as { items?: StockWatchItem[] };
      const list = data.items ?? [];
      setItems(list);
      setIds(list.map((i) => i.sku));
    } finally {
      setLoading(false);
    }
  }, [setIds]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(sku: string) {
    const ok = await removeWishlistSku(sku);
    if (!ok) {
      setError("No se pudo quitar el seguimiento");
      return;
    }
    setItems((prev) => prev.filter((i) => i.sku !== sku));
    setIds(useWishlistStore.getState().ids.filter((id) => id !== sku));
  }

  if (loading) {
    return <p className="text-sm text-text-secondary">Cargando referencias seguidas…</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <Card className="space-y-3 p-6">
        <p className="text-sm text-text-secondary">
          Aún no sigues ninguna referencia. Marca productos con el icono de corazón en el catálogo
          cuando no haya stock y te avisaremos cuando vuelvan a estar disponibles.
        </p>
        <Link href="/search" className="text-sm font-semibold text-text-primary underline">
          Ir al catálogo
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-text-tertiary">{item.sku}</p>
            <p className="text-sm font-semibold text-text-primary">{item.productTitle}</p>
            <StockIndicatorBadge indicator={item.stockIndicator} />
            <p className="text-xs text-text-tertiary">
              Seguimiento desde {new Date(item.createdAt).toLocaleDateString("es-ES")}
              {item.lastNotifiedAt
                ? ` · Último aviso ${new Date(item.lastNotifiedAt).toLocaleDateString("es-ES")}`
                : null}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={item.href}
              className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-text-primary"
            >
              Ver producto
            </Link>
            <button
              type="button"
              onClick={() => void remove(item.sku)}
              className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary"
            >
              Quitar
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
