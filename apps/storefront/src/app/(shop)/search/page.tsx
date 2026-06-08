import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { SearchIcon } from "@/components/ui/icons";
import { appendCrumb, buildBreadcrumbsFromPath } from "@/lib/catalog/build-breadcrumbs";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { loadPlpPageFromSearch } from "@/lib/plp/load-plp-page";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return { title: q ? `Resultados para «${q}»` : "Buscar" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const tree = await getNavigationTree();
  const crumbs = q
    ? appendCrumb(buildBreadcrumbsFromPath(tree, "/search"), q)
    : buildBreadcrumbsFromPath(tree, "/search");

  const plpData = q.trim() ? await loadPlpPageFromSearch(sp) : null;

  return (
    <Container className="pt-6">
      <Breadcrumb items={crumbs} />
      {!q.trim() ? (
        <header className="mb-6 mt-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Buscar</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Escribe en el buscador de la cabecera para ver resultados.
          </p>
        </header>
      ) : plpData ? (
        <>
          <header className="mb-6 mt-4">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
              {plpData.totalFiltered}{" "}
              {plpData.totalFiltered === 1 ? "resultado" : "resultados"} para «{q}»
            </h1>
            <p className="mt-1 text-sm text-text-tertiary">
              Filtros facetados y precios desde el motor de precios.
            </p>
          </header>
          {plpData.totalFiltered === 0 && !hasActiveFilters(plpData) ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong p-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-text-tertiary">
                <SearchIcon size={24} />
              </span>
              <p className="font-bold">No hemos encontrado resultados para «{q}»</p>
              <p className="max-w-sm text-sm text-text-tertiary">
                Prueba con otros términos o revisa la ortografía.
              </p>
            </div>
          ) : (
            <ProductCatalog data={plpData} basePath="/search" searchQuery={q} />
          )}
        </>
      ) : null}
    </Container>
  );
}

function hasActiveFilters(data: { activeFilters: { brands: string[]; suppliers: string[]; colors: string[]; materials: string[]; inStockToday: boolean; eco: boolean; priceMax: number | null } }): boolean {
  const f = data.activeFilters;
  return (
    f.brands.length > 0 ||
    f.suppliers.length > 0 ||
    f.colors.length > 0 ||
    f.materials.length > 0 ||
    f.inStockToday ||
    f.eco ||
    f.priceMax != null
  );
}
