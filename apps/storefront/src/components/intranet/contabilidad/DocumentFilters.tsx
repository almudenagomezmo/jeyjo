"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type DocumentFiltersProps = {
  year: string;
  month: string;
  query: string;
  amountMin: string;
  amountMax: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onAmountMinChange: (value: string) => void;
  onAmountMaxChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

const MONTHS = [
  { value: "", label: "Todos" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleDateString("es-ES", { month: "long" }),
  })),
];

export function DocumentFilters(props: DocumentFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i))

  return (
    <Card className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
        Año
        <select
          value={props.year}
          onChange={(e) => props.onYearChange(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        >
          <option value="">Todos</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
        Mes
        <select
          value={props.month}
          onChange={(e) => props.onMonthChange(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        >
          {MONTHS.map((m) => (
            <option key={m.value || "all"} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary lg:col-span-2">
        Nº factura
        <input
          type="search"
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value)}
          placeholder="Buscar por número…"
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
        Importe mín.
        <input
          type="number"
          min={0}
          step="0.01"
          value={props.amountMin}
          onChange={(e) => props.onAmountMinChange(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
        Importe máx.
        <input
          type="number"
          min={0}
          step="0.01"
          value={props.amountMax}
          onChange={(e) => props.onAmountMaxChange(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        />
      </label>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="button" size="sm" onClick={props.onApply}>
          Filtrar
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={props.onReset}>
          Limpiar
        </Button>
      </div>
    </Card>
  );
}
