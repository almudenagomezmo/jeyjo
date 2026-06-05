"use client";

import { useCallback, useEffect, useState } from "react";

import { PdfDownloadLink } from "@/components/intranet/contabilidad/DocumentTable";
import { YearSelect } from "@/components/intranet/contabilidad/YearSelect";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/format";

type Form347Summary = {
  fiscalYear: number;
  totalOperationsAmount: number;
  currency: string;
};

export function Form347Panel() {
  const defaultYear = new Date().getFullYear() - 1;
  const [year, setYear] = useState(defaultYear);
  const [summary, setSummary] = useState<Form347Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fiscalYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intranet/documents/form-347?year=${fiscalYear}`);
      if (!res.ok) {
        setError("No se pudo cargar la cifra 347");
        setSummary(null);
        return;
      }
      const data = (await res.json()) as { summary?: Form347Summary | null };
      setSummary(data.summary ?? null);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year);
  }, [year, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Cifra 347</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Declaración informativa de operaciones con terceros para tu gestoría
        </p>
      </div>

      <YearSelect value={year} onChange={setYear} />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-text-secondary">Cargando resumen…</p>
      ) : summary ? (
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary">Ejercicio {summary.fiscalYear}</p>
            <p className="mt-2 text-3xl font-extrabold text-text-primary">
              {formatMoney(summary.totalOperationsAmount)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">Importe total operaciones ({summary.currency})</p>
          </div>
          <PdfDownloadLink href={`/api/intranet/documents/form-347/${year}/pdf`} label="Descargar PDF 347" />
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-text-secondary">No hay datos del modelo 347 para el ejercicio seleccionado.</p>
        </Card>
      )}
    </div>
  );
}
