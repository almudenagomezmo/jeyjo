import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { buildBreadcrumbsFromPath } from "@/lib/catalog/build-breadcrumbs";
import { findNavNodeBySlug } from "@/lib/catalog/find-nav-by-slug";
import { collectDescendantSlugs, getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { loadPlpPageFromCategory } from "@/lib/plp/load-plp-page";

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const tree = await getNavigationTree();
  const node = findNavNodeBySlug(tree, category);
  return { title: node?.title ?? "Categoría" };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const sp = await searchParams;
  const tree = await getNavigationTree();
  const node = findNavNodeBySlug(tree, category);
  if (!node) notFound();

  const data = await loadPlpPageFromCategory(collectDescendantSlugs(node), sp);
  const crumbs = buildBreadcrumbsFromPath(tree, `/c/${category}`);

  return (
    <Container className="pt-6">
      <Breadcrumb items={crumbs} />
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{node.title}</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {data.totalFiltered} {data.totalFiltered === 1 ? "producto" : "productos"}
        </p>
      </header>
      <ProductCatalog data={data} basePath={`/c/${category}`} />
    </Container>
  );
}
