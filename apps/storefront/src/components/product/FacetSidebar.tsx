"use client";

import { FilterIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import type { PlpActiveFilters, PlpFacetAggregates } from "@/lib/plp/types";

interface FacetSidebarProps {
  facets: PlpFacetAggregates;
  filters: PlpActiveFilters;
  priceCeiling: number;
  onFiltersChange: (next: PlpActiveFilters) => void;
  onReset: () => void;
}

export function FacetSidebar({
  facets,
  filters,
  priceCeiling,
  onFiltersChange,
  onReset,
}: FacetSidebarProps) {
  const activeCount =
    filters.brands.length +
    filters.colors.length +
    filters.materials.length +
    (filters.inStockToday ? 1 : 0) +
    (filters.eco ? 1 : 0) +
    (filters.priceMax != null && filters.priceMax < priceCeiling ? 1 : 0);

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
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
            <FilterIcon size={16} /> Filtros
          </span>
          {activeCount > 0 && (
            <button type="button" onClick={onReset} className="text-[11px] font-semibold text-text-brand">
              Limpiar
            </button>
          )}
        </div>

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
          <p className="mb-2 text-xs text-text-secondary">Hasta {formatMoney(maxPrice)}</p>
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={1}
            value={maxPrice}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceMax: Number(e.target.value),
              })
            }
            className="w-full accent-[var(--primary)]"
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
      </div>
    </aside>
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
