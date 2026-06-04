"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PackQtyStepper } from "@/components/product/PackQtyStepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  addNonCatalogRequest,
  clearNonCatalogRequests,
  readNonCatalogRequests,
  removeNonCatalogRequest,
  type NonCatalogRequest,
} from "@/lib/intranet/non-catalog-requests";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { formatMoney } from "@/lib/utils/format";

type QuickOrderPreview = {
  sku: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  packUnit: number;
  matchedField: string;
  quote: { netUnit: number; grossUnit: number; appliedRule: string; label?: string };
};

type ValidateRow = {
  ref: string;
  qty: number;
  rowIndex?: number;
  status: string;
  sku?: string;
  slug?: string;
  name?: string;
};

export function QuickOrderPanel() {
  const addItems = useCartStore((s) => s.addItems);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  const [refInput, setRefInput] = useState("");
  const [qty, setQty] = useState(1);
  const [preview, setPreview] = useState<QuickOrderPreview | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [batchRows, setBatchRows] = useState<ValidateRow[] | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const [nonCatalogRef, setNonCatalogRef] = useState("");
  const [nonCatalogNote, setNonCatalogNote] = useState("");
  const [pendingNonCatalog, setPendingNonCatalog] = useState<NonCatalogRequest[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPendingNonCatalog(readNonCatalogRequests());
  }, []);

  const runLookup = useCallback(async (ref: string) => {
    const trimmed = ref.trim();
    if (!trimmed) {
      setPreview(null);
      setLookupError(null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setPreview(null);
    try {
      const res = await fetch(`/api/intranet/quick-order/lookup?ref=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setLookupError("Referencia no encontrada en el catálogo");
        setNonCatalogRef(trimmed);
        return;
      }
      const body = (await res.json()) as { preview?: QuickOrderPreview };
      if (body.preview) {
        setPreview(body.preview);
        setQty(Math.max(body.preview.packUnit, 1));
        setNonCatalogRef("");
      }
    } catch {
      setLookupError("Error de red al validar la referencia");
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runLookup(refInput);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refInput, runLookup]);

  const addToCart = async (items: Array<{ sku: string; qty: number }>) => {
    setAdding(true);
    setToast(null);
    try {
      const res = await fetch("/api/intranet/quick-order/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const body = (await res.json()) as {
        additions?: Array<{ productId: string; qty: number }>;
        error?: string;
        missing?: string[];
      };
      if (!res.ok || !body.additions?.length) {
        setToast(body.error ?? "No se pudieron añadir los artículos");
        return;
      }
      addItems(body.additions.map((a) => ({ productId: a.productId, qty: a.qty })));
      setMiniCartOpen(true);
      const missingNote =
        body.missing && body.missing.length > 0
          ? ` (${body.missing.length} referencias omitidas)`
          : "";
      setToast(
        `Añadido al carrito${missingNote}. Puedes completar observaciones en el checkout.`,
      );
    } catch {
      setToast("Error de red");
    } finally {
      setAdding(false);
    }
  };

  const addSingle = () => {
    if (!preview) return;
    void addToCart([{ sku: preview.sku, qty }]);
  };

  const onExcelFile = async (file: File | null) => {
    if (!file) return;
    setBatchLoading(true);
    setBatchRows(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/intranet/quick-order/validate-batch", {
        method: "POST",
        body: form,
      });
      const body = (await res.json()) as { rows?: ValidateRow[]; error?: string };
      if (!res.ok) {
        setToast(body.error ?? "No se pudo leer el Excel");
        return;
      }
      setBatchRows(body.rows ?? []);
    } catch {
      setToast("Error al subir el archivo");
    } finally {
      setBatchLoading(false);
    }
  };

  const addBatchValid = () => {
    if (!batchRows) return;
    const items = batchRows
      .filter((r) => r.status === "ok" && r.sku)
      .map((r) => ({ sku: r.sku!, qty: r.qty }));
    if (items.length === 0) {
      setToast("No hay referencias válidas para añadir");
      return;
    }
    void addToCart(items);
  };

  const submitNonCatalog = () => {
    const ref = nonCatalogRef.trim() || refInput.trim();
    if (!ref) return;
    const list = addNonCatalogRequest(ref, nonCatalogNote);
    setPendingNonCatalog(list);
    setNonCatalogNote("");
    setLookupError(null);
    setToast("Solicitud guardada. Se incluirá en observaciones al tramitar el pedido.");
  };

  const okBatchCount = batchRows?.filter((r) => r.status === "ok").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold">Pedido rápido</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Introduce una referencia (mayorista, OEM o EAN) o importa un Excel con columnas Referencia y
          Cantidad.
        </p>
      </div>

      {toast && (
        <p className="rounded-md border border-border-subtle bg-surface-muted px-4 py-3 text-sm" role="status">
          {toast}
        </p>
      )}

      <Card className="space-y-4 p-6">
        <h3 className="text-lg font-extrabold">Por referencia</h3>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="text-sm font-medium text-text-secondary">Referencia</label>
            <Input
              className="mt-1"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="SKU, OEM o EAN"
              autoComplete="off"
            />
          </div>
          {preview && (
            <div>
              <span className="text-sm font-medium text-text-secondary">Cantidad</span>
              <div className="mt-1">
                <PackQtyStepper packUnit={preview.packUnit} value={qty} onChange={setQty} />
              </div>
            </div>
          )}
        </div>

        {lookupLoading && <p className="text-sm text-text-tertiary">Validando referencia…</p>}

        {preview && (
          <div className="flex gap-4 rounded-md border border-border-subtle p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
              {preview.imageUrl ? (
                <Image src={preview.imageUrl} alt="" fill className="object-contain" sizes="80px" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-tertiary">Sin foto</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{preview.name}</p>
              <p className="text-sm text-text-secondary">
                {preview.sku} · coincidencia por {preview.matchedField.toUpperCase()}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium text-text-brand">Precio actual</span>{" "}
                <span className="tabular font-semibold">{formatMoney(preview.quote.netUnit)}</span>
                <span className="text-text-tertiary"> (sin IVA)</span>
              </p>
            </div>
            <Button onClick={addSingle} disabled={adding}>
              Añadir al carrito
            </Button>
          </div>
        )}

        {lookupError && !preview && (
          <div className="space-y-3 rounded-md border border-border-subtle bg-surface-muted p-4">
            <p className="text-sm text-danger-text">{lookupError}</p>
            <p className="text-sm text-text-secondary">
              Puedes solicitar el artículo como referencia no catalogada:
            </p>
            <div>
              <label className="text-sm font-medium text-text-secondary">Referencia solicitada</label>
              <Input className="mt-1" value={nonCatalogRef} onChange={(e) => setNonCatalogRef(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Descripción (opcional)</label>
              <textarea
                className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                rows={2}
                value={nonCatalogNote}
                onChange={(e) => setNonCatalogNote(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={submitNonCatalog}>
              Guardar solicitud
            </Button>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold">Importar Excel</h3>
          <a
            href="/api/intranet/quick-order/template"
            className="text-sm font-semibold text-text-brand hover:underline"
          >
            Descargar plantilla
          </a>
        </div>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="text-sm"
          onChange={(e) => void onExcelFile(e.target.files?.[0] ?? null)}
        />
        {batchLoading && <p className="text-sm text-text-tertiary">Procesando archivo…</p>}
        {batchRows && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-text-tertiary">
                    <th className="pb-2">Fila</th>
                    <th className="pb-2">Referencia</th>
                    <th className="pb-2">Cant.</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2">Producto</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row, i) => (
                    <tr key={`${row.ref}-${i}`} className="border-b border-border-subtle">
                      <td className="py-2 tabular">{row.rowIndex ?? i + 1}</td>
                      <td className="py-2 font-mono text-xs">{row.ref}</td>
                      <td className="py-2 tabular">{row.qty}</td>
                      <td className="py-2">
                        {row.status === "ok" && (
                          <span className="text-success-text">OK</span>
                        )}
                        {row.status === "not_found" && (
                          <span className="text-danger-text">No encontrada</span>
                        )}
                        {row.status === "invalid_qty" && (
                          <span className="text-danger-text">Cantidad inválida</span>
                        )}
                        {row.status === "wildcard" && (
                          <span className="text-danger-text">No permitida</span>
                        )}
                      </td>
                      <td className="py-2">{row.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={addBatchValid} disabled={adding || okBatchCount === 0}>
              Añadir {okBatchCount} válidas al carrito
            </Button>
          </>
        )}
      </Card>

      {pendingNonCatalog.length > 0 && (
        <Card className="space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold">Referencias no catalogadas pendientes</h3>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                clearNonCatalogRequests();
                setPendingNonCatalog([]);
              }}
            >
              Vaciar
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {pendingNonCatalog.map((item, index) => (
              <li
                key={`${item.reference}-${item.createdAt}`}
                className="flex items-start justify-between gap-2 rounded-md border border-border-subtle px-3 py-2"
              >
                <span>
                  <strong>{item.reference}</strong>
                  {item.note ? ` — ${item.note}` : null}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-text-brand"
                  onClick={() => setPendingNonCatalog(removeNonCatalogRequest(index))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sm text-text-secondary">
            Se añadirán a{" "}
            <Link href="/checkout" className="font-semibold text-text-brand hover:underline">
              observaciones del checkout
            </Link>{" "}
            al tramitar el pedido.
          </p>
        </Card>
      )}
    </div>
  );
}
