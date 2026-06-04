import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchIcon } from "@/components/ui/icons";
import { searchProducts } from "@/lib/utils/search";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Resultados para «${q}»` : "Buscar" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const results = searchProducts(q);

  return (
    <Container className="pt-6">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Buscar" }, { label: q }]} />
      <header className="mb-6 mt-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
          {results.length} {results.length === 1 ? "resultado" : "resultados"} para «{q}»
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Búsqueda tolerante a plurales y acentos.
        </p>
      </header>

      {results.length === 0 ? (
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
        <ProductGrid products={results} />
      )}
    </Container>
  );
}
