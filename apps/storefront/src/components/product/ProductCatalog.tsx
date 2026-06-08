"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { FacetSidebar } from "@/components/product/FacetSidebar";
import { PlpPagination } from "@/components/product/PlpPagination";
import { PlpViewToggle } from "@/components/product/PlpViewToggle";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductList } from "@/components/product/ProductList";
import { QuickViewDialog } from "@/components/product/QuickViewDialog";
import { Button } from "@/components/ui/Button";
import { LoadingOverlay } from "@/components/ui/JeyjoLoader";
import { normalizePlpFilters } from "@/lib/plp/filters-utils";
import { serializePlpSearchParams } from "@/lib/plp/plp-search-params";
import type { PlpActiveFilters, PlpPagePayload, PlpSortKey } from "@/lib/plp/types";
import {
  readPlpViewMode,
  writePlpViewMode,
  type PlpViewMode,
} from "@/lib/plp/view-mode";

interface ProductCatalogProps {
  data: PlpPagePayload;
  basePath: string;
  searchQuery?: string;
}

const EMPTY_FILTERS: PlpActiveFilters = {
  brands: [],
  colors: [],
  materials: [],
  priceMax: null,
  inStockToday: false,
  eco: false,
};

export function ProductCatalog({ data, basePath, searchQuery }: ProductCatalogProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [quickViewSku, setQuickViewSku] = useState<string | null>(null);
  const [pendingFilters, setPendingFilters] = useState(data.activeFilters);
  const [viewMode, setViewMode] = useState<PlpViewMode>("grid");

  useEffect(() => {
    setViewMode(readPlpViewMode());
  }, []);

  const handleViewModeChange = useCallback((mode: PlpViewMode) => {
    setViewMode(mode);
    writePlpViewMode(mode);
  }, []);

  const priceCeiling = data.facets.priceMax;

  useEffect(() => {
    setPendingFilters(data.activeFilters);
  }, [data.activeFilters]);

  const navigate = useCallback(
    (next: {
      filters: typeof data.activeFilters;
      sort: PlpSortKey;
      page?: number;
    }) => {
      const sp = serializePlpSearchParams({
        filters: next.filters,
        sort: next.sort,
        page: next.page ?? 1,
        q: searchQuery,
      });
      const qs = sp.toString();
      const href = qs ? `${basePath}?${qs}` : basePath;
      startNavigation(() => {
        router.push(href);
      });
    },
    [basePath, router, searchQuery],
  );

  const plpItems = useMemo(
    () =>
      data.rows.map((row) => ({
        row,
        quote: data.quotesBySku[row.sku],
        stock: data.stockBySku[row.sku],
      })),
    [data],
  );

  const quickRow = data.rows.find((r) => r.sku === quickViewSku) ?? null;

  const applyFilters = () => {
    navigate({
      filters: normalizePlpFilters(pendingFilters, priceCeiling),
      sort: data.sort,
      page: 1,
    });
  };

  const resetFilters = () => {
    setPendingFilters(EMPTY_FILTERS);
    navigate({
      filters: EMPTY_FILTERS,
      sort: data.sort,
      page: 1,
    });
  };

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <FacetSidebar
          facets={data.facets}
          filters={pendingFilters}
          appliedFilters={data.activeFilters}
          priceCeiling={priceCeiling}
          onFiltersChange={setPendingFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <div className="relative min-h-[240px]">
          {isNavigating && (
            <LoadingOverlay label="Actualizando resultados…" />
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-tertiary">
              {data.totalFiltered}{" "}
              {data.totalFiltered === 1 ? "producto" : "productos"}
            </p>
            <div className="flex items-center gap-3">
              <PlpViewToggle value={viewMode} onChange={handleViewModeChange} />
              <label className="flex items-center gap-2 text-sm">
                <span className="text-text-tertiary">Ordenar</span>
                <select
                  value={data.sort}
                  onChange={(e) =>
                    navigate({
                      filters: data.activeFilters,
                      sort: e.target.value as PlpSortKey,
                      page: 1,
                    })
                  }
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
          </div>

          {data.rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong p-12 text-center">
              <p className="font-bold">Sin resultados con esos filtros</p>
              <p className="mt-1 text-sm text-text-tertiary">Prueba a quitar algún filtro.</p>
              <Button variant="secondary" className="mt-4" onClick={resetFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <ProductGrid
                  plpItems={plpItems}
                  className="lg:grid-cols-3 xl:grid-cols-4"
                  onQuickView={setQuickViewSku}
                />
              ) : (
                <ProductList plpItems={plpItems} onQuickView={setQuickViewSku} />
              )}
              <PlpPagination
                basePath={basePath}
                page={data.page}
                pageSize={data.pageSize}
                total={data.totalFiltered}
                filters={data.activeFilters}
                sort={data.sort}
                q={searchQuery}
              />
            </>
          )}
        </div>
      </div>

      <QuickViewDialog
        row={quickRow}
        quote={quickViewSku ? (data.quotesBySku[quickViewSku] ?? null) : null}
        stock={quickViewSku ? (data.stockBySku[quickViewSku] ?? null) : null}
        onClose={() => setQuickViewSku(null)}
      />
    </>
  );
}
