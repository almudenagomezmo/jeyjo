"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  loadUncataloguedRequests,
  saveUncataloguedRequest,
} from "@/lib/checkout/uncatalogued-requests";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { formatMoney } from "@/lib/utils/format";

type QuickOrderLinePreview = {
  inputReference: string;
  sku: string | null;
  productSlug: string | null;
  title: string | null;
  imageUrl: string | null;
  qty: number;
  packUnit: number;
  matchedBy: "sku" | "oem" | "ean" | null;
  status: "ok" | "not_found" | "wildcard" | "invalid_qty";
  quote: {
    netUnit: number;
    grossUnit: number;
    appliedRule: string;
    label?: string;
  } | null;
};

const TEMPLATE_HREF = "/intranet/plantilla-pedido-rapido.xlsx";

const statusLabel: Record<QuickOrderLinePreview["status"], string> = {
  ok: "OK",
  not_found: "No encontrada",
  wildcard: "No disponible",
  invalid_qty: "Cantidad inválida",
};

export function QuickOrderPanel() {
  const addItems = useCartStore((s) => s.addItems);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  const [reference, setReference] = useState("");
  const [qty, setQty] = useState(1);
  const [preview, setPreview] = useState<QuickOrderLinePreview | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [uncataloguedDesc, setUncataloguedDesc] = useState("");
  const [uncataloguedQty, setUncataloguedQty] = useState(1);
  const [savedUncatalogued, setSavedUncatalogued] = useState(0);

  const [excelRows, setExcelRows] = useState<QuickOrderLinePreview[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelParsing, setExcelParsing] = useState(false);
  const [selectedExcel, setSelectedExcel] = useState<Set<number>>(new Set());

  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runLookup = useCallback(async (ref: string, quantity: number) => {
    const trimmed = ref.trim();
    if (!trimmed) {
      setPreview(null);
      return;
    }
    setLookupLoading(true);
    try {
      const res = await fetch("/api/intranet/quick-order/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: trimmed, qty: quantity }),
      });
      if (!res.ok) {
        setPreview(null);
        return;
      }
      const body = (await res.json()) as { preview: QuickOrderLinePreview };
      setPreview(body.preview);
    } catch {
      setPreview(null);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runLookup(reference, qty);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [reference, qty, runLookup]);

  useEffect(() => {
    setSavedUncatalogued(loadUncataloguedRequests().length);
  }, []);

  const addToCart = async (items: Array<{ reference: string; qty: number }>) => {
    if (items.length === 0) return;
    setAdding(true);
    setToast(null);
    try {
      const res = await fetch("/api/intranet/quick-order/add", {
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
        body.missing?.length ? ` (${body.missing.length} referencias omitidas)` : "";
      setToast(
        `Artículos añadidos al carrito${missingNote}. Completa observaciones en el checkout si procede.`,
      );
    } catch {
      setToast("Error al añadir al carrito");
    } finally {
      setAdding(false);
    }
  };

  const addSingle = () => {
    if (!preview || preview.status !== "ok") return;
    void addToCart([{ reference: preview.inputReference, qty: preview.qty }]);
  };

  const onExcelFile = async (file: File | null) => {
    if (!file) return;
    setExcelParsing(true);
    setExcelErrors([]);
    setExcelRows([]);
    setSelectedExcel(new Set());
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/intranet/quick-order/parse-excel", {
        method: "POST",
        body: form,
      });
      const body = (await res.json()) as {
        rows?: QuickOrderLinePreview[];
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setToast(body.error ?? "Error al leer el Excel");
        return;
      }
      setExcelRows(body.rows ?? []);
      setExcelErrors(body.errors ?? []);
      const okIndexes = new Set(
        (body.rows ?? [])
          .map((r, i) => (r.status === "ok" ? i : -1))
          .filter((i) => i >= 0),
      );
      setSelectedExcel(okIndexes);
    } catch {
      setToast("Error al subir el archivo");
    } finally {
      setExcelParsing(false);
    }
  };

  const addExcelSelected = () => {
    const items = excelRows
      .filter((_, i) => selectedExcel.has(i) && excelRows[i]?.status === "ok")
      .map((r) => ({ reference: r.inputReference, qty: r.qty }));
    void addToCart(items);
  };

  const addAllValidExcel = () => {
    const items = excelRows
      .filter((r) => r.status === "ok")
      .map((r) => ({ reference: r.inputReference, qty: r.qty }));
    void addToCart(items);
  };

  const saveUncatalogued = () => {
    const desc = uncataloguedDesc.trim();
    if (!desc) return;
    saveUncataloguedRequest({
      reference: reference.trim() || preview?.inputReference || "",
      description: desc,
      qty: Math.max(1, uncataloguedQty),
    });
    setSavedUncatalogued(loadUncataloguedRequests().length);
    setUncataloguedDesc("");
    setToast("Solicitud guardada. Se incluirá en las observaciones del checkout.");
  };

  const showUncatalogued = preview?.status === "not_found" && reference.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pedido rápido</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Introduce referencias (Jeyjo, OEM o EAN) o importa un Excel
        </p>
      </div>

      {toast && (
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm" role="status">
          {toast}{" "}
          <Link href="/cart" className="font-semibold text-text-brand underline">
            Ver carrito
          </Link>
        </p>
      )}

      {savedUncatalogued > 0 && (
        <p className="text-sm text-text-secondary">
          Tienes {savedUncatalogued} solicitud(es) no catalogada(s) pendientes de enviar en el checkout.
        </p>
      )}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-bold">Referencia manual</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Referencia</span>
            <input
              type="text"
              className="rounded-md border border-border bg-surface px-3 py-2 font-mono"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="REF-001, OEM o EAN"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Cantidad</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              disabled={adding || !preview || preview.status !== "ok"}
              onClick={addSingle}
            >
              Añadir al carrito
            </Button>
          </div>
        </div>

        {lookupLoading && (
          <p className="text-sm text-text-secondary">Buscando referencia…</p>
        )}

        {preview && preview.status === "ok" && (
          <div className="flex gap-4 rounded-md border border-border p-3">
            {preview.imageUrl ? (
              <Image
                src={preview.imageUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-surface-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{preview.title}</p>
              <p className="font-mono text-sm text-text-secondary">{preview.sku}</p>
              {preview.matchedBy !== "sku" && (
                <p className="text-xs text-text-tertiary">
                  Coincidencia por {preview.matchedBy === "oem" ? "OEM" : "EAN"}
                </p>
              )}
              {preview.packUnit > 1 && preview.qty !== qty && (
                <p className="text-xs text-text-secondary">
                  Cantidad ajustada a envase de {preview.packUnit} uds: {preview.qty}
                </p>
              )}
              {preview.quote && (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{formatMoney(preview.quote.netUnit)}</span>
                  <span className="ml-2 text-xs text-text-secondary">Precio actual</span>
                </p>
              )}
            </div>
          </div>
        )}

        {preview && preview.status !== "ok" && preview.status !== "not_found" && (
          <p className="text-sm text-amber-700">{statusLabel[preview.status]}</p>
        )}

        {showUncatalogued && (
          <div className="space-y-3 rounded-md border border-dashed border-border bg-surface-muted/50 p-4">
            <p className="text-sm font-semibold">Referencia no catalogada</p>
            <p className="text-sm text-text-secondary">
              Describe el artículo que necesitas. No se añadirá al carrito; se enviará como solicitud en el
              checkout.
            </p>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={uncataloguedDesc}
              onChange={(e) => setUncataloguedDesc(e.target.value)}
              placeholder="Descripción del artículo solicitado"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                Cantidad
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-md border border-border px-2 py-1"
                  value={uncataloguedQty}
                  onChange={(e) => setUncataloguedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </label>
              <Button type="button" variant="secondary" onClick={saveUncatalogued}>
                Guardar solicitud
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Importar Excel</h2>
          <a
            href={TEMPLATE_HREF}
            download
            className="text-sm font-semibold text-text-brand underline"
          >
            Descargar plantilla
          </a>
        </div>
        <p className="text-sm text-text-secondary">
          Columnas obligatorias: <strong>Referencia</strong> y <strong>Cantidad</strong> (máx. 500 filas).
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="text-sm"
          disabled={excelParsing}
          onChange={(e) => void onExcelFile(e.target.files?.[0] ?? null)}
        />
        {excelParsing && <p className="text-sm text-text-secondary">Procesando archivo…</p>}
        {excelErrors.length > 0 && (
          <ul className="list-inside list-disc text-sm text-amber-800">
            {excelErrors.slice(0, 5).map((err) => (
              <li key={err}>{err}</li>
            ))}
            {excelErrors.length > 5 && <li>…y {excelErrors.length - 5} más</li>}
          </ul>
        )}
        {excelRows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={
                          excelRows.filter((r) => r.status === "ok").length > 0 &&
                          excelRows
                            .map((r, i) => (r.status === "ok" ? i : -1))
                            .filter((i) => i >= 0)
                            .every((i) => selectedExcel.has(i))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExcel(
                              new Set(
                                excelRows
                                  .map((r, i) => (r.status === "ok" ? i : -1))
                                  .filter((i) => i >= 0),
                              ),
                            );
                          } else {
                            setSelectedExcel(new Set());
                          }
                        }}
                        aria-label="Seleccionar todas las válidas"
                      />
                    </th>
                    <th className="py-2">Referencia</th>
                    <th className="py-2">Cant.</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Producto</th>
                  </tr>
                </thead>
                <tbody>
                  {excelRows.map((row, i) => (
                    <tr key={`${row.inputReference}-${i}`} className="border-b border-border/60">
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          disabled={row.status !== "ok"}
                          checked={selectedExcel.has(i)}
                          onChange={() => {
                            setSelectedExcel((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 font-mono">{row.inputReference}</td>
                      <td className="py-2">{row.qty}</td>
                      <td className="py-2">{statusLabel[row.status]}</td>
                      <td className="py-2">{row.title ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={adding || selectedExcel.size === 0}
                onClick={addExcelSelected}
              >
                Añadir seleccionadas ({selectedExcel.size})
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={adding || !excelRows.some((r) => r.status === "ok")}
                onClick={addAllValidExcel}
              >
                Añadir todas las válidas
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
