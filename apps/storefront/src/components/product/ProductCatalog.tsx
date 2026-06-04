"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { FilterIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import type { Product } from "@/lib/types";

type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "name";

interface ProductCatalogProps {
  products: Product[];
  /** Optional max price (ex-VAT) for the slider; defaults to the data's max. */
  maxPrice?: number;
}

interface Filters {
  brands: string[];
  inStock: boolean;
  eco: boolean;
  offers: boolean;
  maxPrice: number;
}

export function ProductCatalog({ products, maxPrice }: ProductCatalogProps) {
  const priceCeiling = useMemo(
    () => maxPrice ?? Math.ceil(Math.max(...products.map((p) => p.priceNoVat), 10)),
    [products, maxPrice],
  );
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );

  const [sort, setSort] = useState<SortKey>("relevance");
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    inStock: false,
    eco: false,
    offers: false,
    maxPrice: priceCeiling,
  });

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.inStock && p.stock === 0) return false;
      if (filters.eco && !p.eco) return false;
      if (filters.offers && !p.offer) return false;
      if (p.priceNoVat > filters.maxPrice) return false;
      return true;
    });
    list = [...list];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.priceNoVat - b.priceNoVat);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceNoVat - a.priceNoVat);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
    }
    return list;
  }, [products, filters, sort]);

  const toggleBrand = (brand: string) =>
    setFilters((f) => ({
      ...f,
      brands: f.brands.includes(brand)
        ? f.brands.filter((b) => b !== brand)
        : [...f.brands, brand],
    }));

  const reset = () =>
    setFilters({ brands: [], inStock: false, eco: false, offers: false, maxPrice: priceCeiling });

  const activeFilters =
    filters.brands.length + (filters.inStock ? 1 : 0) + (filters.eco ? 1 : 0) + (filters.offers ? 1 : 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
      {/* Filters */}
      <aside className="lg:sticky lg:top-[88px]">
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold">
              <FilterIcon size={16} /> Filtros
            </span>
            {activeFilters > 0 && (
              <button onClick={reset} className="text-[11px] font-semibold text-text-brand">
                Limpiar
              </button>
            )}
          </div>

          <FilterGroup title="Marca">
            <div className="flex flex-col gap-1.5">
              {brands.map((brand) => (
                <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Precio sin IVA">
            <p className="mb-2 text-xs text-text-secondary">
              Hasta {formatMoney(filters.maxPrice)}
            </p>
            <input
              type="range"
              min={0}
              max={priceCeiling}
              step={1}
              value={filters.maxPrice}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
              className="w-full accent-[var(--primary)]"
            />
          </FilterGroup>

          <FilterGroup title="Etiquetas">
            <div className="flex flex-col gap-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters((f) => ({ ...f, inStock: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Solo en stock
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.eco}
                  onChange={(e) => setFilters((f) => ({ ...f, eco: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                ECO / Sostenible
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.offers}
                  onChange={(e) => setFilters((f) => ({ ...f, offers: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Solo ofertas
              </label>
            </div>
          </FilterGroup>
        </div>
      </aside>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-tertiary">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="rating">Mejor valorados</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-12 text-center">
            <p className="font-bold">Sin resultados con esos filtros</p>
            <p className="mt-1 text-sm text-text-tertiary">Prueba a quitar algún filtro.</p>
            <Button variant="secondary" className="mt-4" onClick={reset}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <ProductGrid products={filtered} className="lg:grid-cols-3 xl:grid-cols-4" />
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-subtle py-3 first-of-type:border-t-0">
      <p className="mb-2 text-[13px] font-semibold">{title}</p>
      {children}
    </div>
  );
}
