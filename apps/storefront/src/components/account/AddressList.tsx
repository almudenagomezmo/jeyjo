"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerAddress } from "@jeyjo/database-types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AddressList({ refreshKey }: { refreshKey: number }) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses");
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Error al cargar");
      }
      const body = (await res.json()) as { addresses?: CustomerAddress[] };
      setAddresses(body.addresses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const remove = async (id: string) => {
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) void load();
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-surface-muted" aria-hidden />;
  }

  if (error) {
    return <p className="text-sm text-danger-text">{error}</p>;
  }

  if (addresses.length === 0) {
    return (
      <p className="text-sm text-text-secondary">Aún no tienes direcciones de envío guardadas.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {addresses.map((addr) => (
        <li key={addr.id}>
          <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="text-sm">
              {addr.label && <p className="font-bold">{addr.label}</p>}
              {addr.is_default && (
                <span className="text-xs font-semibold text-text-brand">Predeterminada</span>
              )}
              <p className="mt-1 text-text-secondary">
                {addr.address_line1}
                {addr.address_line2 ? `, ${addr.address_line2}` : ""}
              </p>
              <p className="text-text-secondary">
                {addr.postal_code} {addr.city}
              </p>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={() => void remove(addr.id)}>
              Eliminar
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
