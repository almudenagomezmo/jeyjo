import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ComparePageSync } from "@/components/compare/ComparePageSync";
import { CompareTable } from "@/components/compare/CompareTable";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { isCompareEnabled } from "@/lib/compare/is-compare-enabled";
import { loadComparePage } from "@/lib/compare/load-compare-page";
import { parseCompareSkusParam } from "@/lib/compare/parse-compare-skus";

export const metadata: Metadata = {
  title: "Comparar productos",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  if (!isCompareEnabled()) {
    redirect("/");
  }

  const sp = await searchParams;
  const requestedSkus = parseCompareSkusParam(sp.skus);

  if (requestedSkus.length === 0) {
    redirect("/");
  }

  const result = await loadComparePage(requestedSkus);
  const validItems = result.columns.map((col) => ({
    sku: col.sku,
    slug: col.slug,
    title: col.title,
    imageUrl: col.imageUrl,
  }));

  return (
    <Container className="pt-6 pb-32">
      <ComparePageSync
        validItems={validItems}
        showInvalidWarning={result.invalidSkus.length > 0}
      />
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Comparar productos", href: "/comparar" },
        ]}
      />
      <header className="mb-6 mt-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
          Comparar productos
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Hasta 3 productos lado a lado para elegir el más adecuado.
        </p>
      </header>

      {result.columns.length < 2 ? (
        <div className="rounded-lg border border-border bg-surface-muted p-8 text-center">
          <p className="text-sm text-text-secondary">
            {result.columns.length === 1
              ? "Selecciona al menos otro producto en el listado para comparar."
              : "No hay suficientes productos válidos para comparar."}
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            Volver al catálogo
          </Link>
        </div>
      ) : (
        <CompareTable columns={result.columns} />
      )}
    </Container>
  );
}
