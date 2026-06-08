"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FilterIcon } from "@/components/ui/icons";
import {
  arePlpFiltersEqual,
  countActivePlpFilters,
} from "@/lib/plp/filters-utils";
import { formatMoney } from "@/lib/utils/format";
import type { PlpActiveFilters, PlpFacetAggregates } from "@/lib/plp/types";

interface FacetSidebarProps {
  facets: PlpFacetAggregates;
  filters: PlpActiveFilters;
  appliedFilters: PlpActiveFilters;
  priceCeiling: number;
  onFiltersChange: (next: PlpActiveFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FacetSidebar({
  facets,
  filters,
  appliedFilters,
  priceCeiling,
  onFiltersChange,
  onApply,
  onReset,
}: FacetSidebarProps) {
  const pendingCount = countActivePlpFilters(filters, priceCeiling);
  const appliedCount = countActivePlpFilters(appliedFilters, priceCeiling);
  const hasPendingChanges = !arePlpFiltersEqual(filters, appliedFilters, priceCeiling);

  const toggleList = (
    key: "brands" | "colors" | "materials",
    value: string,
    listKey: "brands" | "colors" | "materials",
  ) => {
    const list = filters[listKey];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const maxPrice = filters.priceMax ?? priceCeiling;

  return (
    <aside className="lg:sticky lg:top-[88px]">
      <div
        className={`rounded-lg border bg-surface p-5 transition-[border-color,box-shadow] ${
          hasPendingChanges
            ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
            : "border-border"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
            <FilterIcon size={16} /> Filtros
            {pendingCount > 0 && (
              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-text-secondary">
                {pendingCount}
              </span>
            )}
          </span>
          {(pendingCount > 0 || appliedCount > 0) && (
            <button type="button" onClick={onReset} className="text-[11px] font-semibold text-text-brand">
              Limpiar
            </button>
          )}
        </div>

        {hasPendingChanges && (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-900">
            Tienes filtros seleccionados que aún no se han aplicado. Pulsa{" "}
            <span className="font-semibold">Filtrar</span> para actualizar los resultados.
          </p>
        )}

        {facets.brands.length > 0 && (
          <FacetGroup title="Marca / fabricante">
            {facets.brands.map((opt) => (
              <FacetCheckbox
                key={opt.value}
                label={opt.value}
                count={opt.count}
                checked={filters.brands.includes(opt.value)}
                onChange={() => toggleList("brands", opt.value, "brands")}
              />
            ))}
          </FacetGroup>
        )}

        {facets.colors.length > 0 && (
          <FacetGroup title="Color">
            {facets.colors.map((opt) => (
              <FacetCheckbox
                key={opt.value}
                label={opt.value}
                count={opt.count}
                checked={filters.colors.includes(opt.value)}
                onChange={() => toggleList("colors", opt.value, "colors")}
              />
            ))}
          </FacetGroup>
        )}

        {facets.materials.length > 0 && (
          <FacetGroup title="Material">
            {facets.materials.map((opt) => (
              <FacetCheckbox
                key={opt.value}
                label={opt.value}
                count={opt.count}
                checked={filters.materials.includes(opt.value)}
                onChange={() => toggleList("materials", opt.value, "materials")}
              />
            ))}
          </FacetGroup>
        )}

        <FacetGroup title="Precio sin IVA">
          <PriceRangeFilter
            value={maxPrice}
            priceCeiling={priceCeiling}
            onCommit={(priceMax) =>
              onFiltersChange({
                ...filters,
                priceMax,
              })
            }
          />
        </FacetGroup>

        <FacetGroup title="Disponibilidad">
          <FacetCheckbox
            label="En stock para envío hoy"
            count={null}
            checked={filters.inStockToday}
            onChange={() =>
              onFiltersChange({ ...filters, inStockToday: !filters.inStockToday })
            }
          />
        </FacetGroup>

        <FacetGroup title="Etiquetas">
          <FacetCheckbox
            label="ECO / Sostenible"
            count={null}
            checked={filters.eco}
            onChange={() => onFiltersChange({ ...filters, eco: !filters.eco })}
          />
        </FacetGroup>

        <Button
          type="button"
          variant={hasPendingChanges ? "primary" : "secondary"}
          block
          className="mt-4"
          disabled={!hasPendingChanges}
          onClick={onApply}
        >
          Filtrar
        </Button>
      </div>
    </aside>
  );
}

function PriceRangeFilter({
  value,
  priceCeiling,
  onCommit,
}: {
  value: number;
  priceCeiling: number;
  onCommit: (priceMax: number) => void;
}) {
  const [localValue, setLocalValue] = useState<number | null>(null);
  const displayValue = localValue ?? value;

  const commit = useCallback(
    (next: number) => {
      setLocalValue(null);
      onCommit(next);
    },
    [onCommit],
  );

  return (
    <>
      <p className="mb-2 text-xs text-text-secondary">Hasta {formatMoney(displayValue)}</p>
      <input
        type="range"
        min={0}
        max={priceCeiling}
        step={1}
        value={displayValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onPointerCancel={() => setLocalValue(null)}
        onBlur={(e) => {
          if (localValue != null) {
            commit(Number(e.currentTarget.value));
          }
        }}
        onKeyUp={(e) => {
          if (localValue != null) {
            commit(Number(e.currentTarget.value));
          }
        }}
        className="w-full accent-[var(--primary)]"
      />
    </>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-subtle py-3 first-of-type:border-t-0">
      <p className="mb-2 text-[13px] font-semibold">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function FacetCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number | null;
  checked: boolean;
  onChange: () => void;
}) {
  const disabled = count === 0;
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-2 text-sm ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        {label}
      </span>
      {count != null && (
        <span className="text-[11px] tabular-nums text-text-tertiary">{count}</span>
      )}
    </label>
  );
}
