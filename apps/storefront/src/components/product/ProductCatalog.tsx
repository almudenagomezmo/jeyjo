"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { FacetSidebar } from "@/components/product/FacetSidebar";
import { PlpPagination } from "@/components/product/PlpPagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import { QuickViewDialog } from "@/components/product/QuickViewDialog";
import { Button } from "@/components/ui/Button";
import { serializePlpSearchParams } from "@/lib/plp/plp-search-params";
import type { PlpPagePayload, PlpSortKey } from "@/lib/plp/types";

interface ProductCatalogProps {
  data: PlpPagePayload;
  basePath: string;
  searchQuery?: string;
}

export function ProductCatalog({ data, basePath, searchQuery }: ProductCatalogProps) {
  const router = useRouter();
  const [quickViewSku, setQuickViewSku] = useState<string | null>(null);

  const priceCeiling = data.facets.priceMax;

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
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [basePath, router, searchQuery, data.activeFilters, data.sort],
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

  const resetFilters = () => {
    navigate({
      filters: {
        brands: [],
        colors: [],
        materials: [],
        priceMax: null,
        inStockToday: false,
        eco: false,
      },
      sort: data.sort,
      page: 1,
    });
  };

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <FacetSidebar
          facets={data.facets}
          filters={data.activeFilters}
          priceCeiling={priceCeiling}
          onFiltersChange={(filters) => navigate({ filters, sort: data.sort, page: 1 })}
          onReset={resetFilters}
        />

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-tertiary">
              {data.totalFiltered}{" "}
              {data.totalFiltered === 1 ? "producto" : "productos"}
            </p>
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
              <ProductGrid
                plpItems={plpItems}
                className="lg:grid-cols-3 xl:grid-cols-4"
                onQuickView={setQuickViewSku}
              />
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
