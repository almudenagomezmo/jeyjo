"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/format";

type TariffLine = {
  sku: string;
  name: string;
  imageUrl: string | null;
  minQty: number | null;
  recommendedNetPrice: number;
  discount1Pct: number | null;
  discount2Pct: number | null;
  discountDerived: boolean;
  netPrice: number;
  validTo: string | null;
  statusLabel: "Vigente" | "Caducado";
  canRequestReview: boolean;
};

type GroupOfferLine = {
  sku: string;
  name: string;
  imageUrl: string | null;
  offerNetPrice: number;
  validTo: string | null;
};

type TariffsResponse = {
  specialPrices: TariffLine[];
  groupOffers: GroupOfferLine[];
  total: number;
  page: number;
  pageSize: number;
};

function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(2)} %`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function CustomTariffsPanel() {
  const [skuFilter, setSkuFilter] = useState("");
  const [appliedSku, setAppliedSku] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TariffsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reviewingSku, setReviewingSku] = useState<string | null>(null);

  const load = useCallback(async (sku: string, p: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(p), pageSize: "25" });
    if (sku) params.set("sku", sku);
    try {
      const res = await fetch(`/api/intranet/custom-tariffs?${params}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Sesión expirada" : "No se pudieron cargar las tarifas");
        setData(null);
        return;
      }
      setData((await res.json()) as TariffsResponse);
    } catch {
      setError("Error de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(appliedSku, page);
  }, [appliedSku, page, load]);

  const requestReview = async (sku: string) => {
    setReviewingSku(sku);
    setToast(null);
    try {
      const res = await fetch("/api/intranet/custom-tariffs/review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const body = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) {
        setToast(body.error ?? "No se pudo enviar la solicitud");
        return;
      }
      setToast(body.message ?? "Solicitud registrada correctamente");
    } catch {
      setToast("Error de red al solicitar revisión");
    } finally {
      setReviewingSku(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Precios especiales</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Consulta tus tarifas pactadas, descuentos y ofertas de grupo vigentes
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-text-secondary">Referencia</span>
            <input
              type="text"
              placeholder="REF-004"
              className="rounded-md border border-border bg-surface px-3 py-2"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setAppliedSku(skuFilter);
                setPage(1);
              }}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSkuFilter("");
                setAppliedSku("");
                setPage(1);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {toast ? (
        <Card className="border-accent/30 bg-accent/5 p-4 text-sm text-text-primary">{toast}</Card>
      ) : null}

      {error ? (
        <Card className="p-8 text-center text-text-secondary">{error}</Card>
      ) : loading ? (
        <Card className="p-8 text-center text-text-secondary">Cargando tarifas…</Card>
      ) : !data?.specialPrices.length ? (
        <Card className="p-8 text-center text-text-secondary">
          No hay precios especiales pactados registrados para tu empresa.
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-text-secondary">
                <tr>
                  <th className="p-3">Artículo</th>
                  <th className="p-3">Cant.</th>
                  <th className="p-3">P. recomendado</th>
                  <th className="p-3">Dto. 1</th>
                  <th className="p-3">Dto. 2</th>
                  <th className="p-3">Importe neto</th>
                  <th className="p-3">Vigencia</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.specialPrices.map((line) => (
                  <TariffTableRow
                    key={line.sku}
                    line={line}
                    reviewing={reviewingSku === line.sku}
                    onReview={() => void requestReview(line.sku)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {data.specialPrices.map((line) => (
              <TariffCard
                key={line.sku}
                line={line}
                reviewing={reviewingSku === line.sku}
                onReview={() => void requestReview(line.sku)}
              />
            ))}
          </div>
        </>
      )}

      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Página {data.page} de {totalPages} ({data.total} tarifas)
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

      {data && data.groupOffers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Ofertas de grupo activas</h2>
          <p className="text-sm text-text-secondary">
            Promociones de catálogo o revista que aplican a tu grupo de cliente
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-text-secondary">
                <tr>
                  <th className="p-3">Artículo</th>
                  <th className="p-3">Precio oferta</th>
                  <th className="p-3">Vigencia</th>
                </tr>
              </thead>
              <tbody>
                {data.groupOffers.map((offer) => (
                  <tr key={offer.sku} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <ProductCell name={offer.name} sku={offer.sku} imageUrl={offer.imageUrl} />
                    </td>
                    <td className="p-3 font-semibold">{formatMoney(offer.offerNetPrice)}</td>
                    <td className="p-3 text-text-secondary">{formatDate(offer.validTo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProductCell({
  name,
  sku,
  imageUrl,
}: {
  name: string;
  sku: string;
  imageUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-text-secondary">—</span>
        )}
      </div>
      <div>
        <p className="font-medium text-text-primary">{name}</p>
        <p className="text-xs text-text-secondary">{sku}</p>
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: "Vigente" | "Caducado" }) {
  const isActive = label === "Vigente";
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
          : "inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary"
      }
    >
      {label}
    </span>
  );
}

function TariffTableRow({
  line,
  reviewing,
  onReview,
}: {
  line: TariffLine;
  reviewing: boolean;
  onReview: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <ProductCell name={line.name} sku={line.sku} imageUrl={line.imageUrl} />
      </td>
      <td className="p-3 text-text-secondary">{line.minQty ?? "—"}</td>
      <td className="p-3">{formatMoney(line.recommendedNetPrice)}</td>
      <td className="p-3">
        {formatPct(line.discount1Pct)}
        {line.discountDerived ? (
          <span className="ml-1 text-xs text-text-secondary" title="Calculado">
            *
          </span>
        ) : null}
      </td>
      <td className="p-3">{formatPct(line.discount2Pct)}</td>
      <td className="p-3 font-semibold">{formatMoney(line.netPrice)}</td>
      <td className="p-3 text-text-secondary">{formatDate(line.validTo)}</td>
      <td className="p-3">
        <StatusBadge label={line.statusLabel} />
      </td>
      <td className="p-3">
        {line.canRequestReview ? (
          <Button type="button" variant="secondary" disabled={reviewing} onClick={onReview}>
            Solicitar revisión de precio
          </Button>
        ) : null}
      </td>
    </tr>
  );
}

function TariffCard({
  line,
  reviewing,
  onReview,
}: {
  line: TariffLine;
  reviewing: boolean;
  onReview: () => void;
}) {
  return (
    <Card className="p-4">
      <ProductCell name={line.name} sku={line.sku} imageUrl={line.imageUrl} />
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-text-secondary">P. recomendado</dt>
        <dd>{formatMoney(line.recommendedNetPrice)}</dd>
        <dt className="text-text-secondary">Importe neto</dt>
        <dd className="font-semibold">{formatMoney(line.netPrice)}</dd>
        <dt className="text-text-secondary">Dto. 1 / 2</dt>
        <dd>
          {formatPct(line.discount1Pct)} / {formatPct(line.discount2Pct)}
        </dd>
        <dt className="text-text-secondary">Vigencia</dt>
        <dd>{formatDate(line.validTo)}</dd>
        <dt className="text-text-secondary">Estado</dt>
        <dd>
          <StatusBadge label={line.statusLabel} />
        </dd>
      </dl>
      {line.canRequestReview ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          disabled={reviewing}
          onClick={onReview}
        >
          Solicitar revisión de precio
        </Button>
      ) : null}
    </Card>
  );
}
