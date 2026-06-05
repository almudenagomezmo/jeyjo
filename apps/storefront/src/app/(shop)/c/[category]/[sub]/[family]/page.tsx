import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { buildBreadcrumbsFromPath } from "@/lib/catalog/build-breadcrumbs";
import { findNavNodeBySlug } from "@/lib/catalog/find-nav-by-slug";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { loadPlpPageFromCategory } from "@/lib/plp/load-plp-page";

interface PageProps {
  params: Promise<{ category: string; sub: string; family: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, sub, family } = await params;
  const tree = await getNavigationTree();
  const root = findNavNodeBySlug(tree, category);
  const subNode = root ? findNavNodeBySlug(root.children, sub) : null;
  const familyNode = subNode ? findNavNodeBySlug(subNode.children, family) : null;
  return {
    title: familyNode
      ? `${familyNode.title} · ${subNode?.title}`
      : "Categoría",
  };
}

export default async function FamilyPage({ params, searchParams }: PageProps) {
  const { category, sub, family } = await params;
  const sp = await searchParams;
  const tree = await getNavigationTree();
  const root = findNavNodeBySlug(tree, category);
  const subNode = root ? findNavNodeBySlug(root.children, sub) : null;
  const familyNode = subNode ? findNavNodeBySlug(subNode.children, family) : null;
  if (!root || !subNode || !familyNode) notFound();

  const data = await loadPlpPageFromCategory([category, sub, family], sp);
  const crumbs = buildBreadcrumbsFromPath(tree, `/c/${category}/${sub}/${family}`);

  return (
    <Container className="pt-6">
      <Breadcrumb items={crumbs} />
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{familyNode.title}</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {data.totalFiltered} {data.totalFiltered === 1 ? "producto" : "productos"} en{" "}
          {subNode.title.toLowerCase()}
        </p>
      </header>
      {data.totalFiltered > 0 || Object.values(sp).some(Boolean) ? (
        <ProductCatalog data={data} basePath={`/c/${category}/${sub}/${family}`} />
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong p-12 text-center">
          <p className="font-bold">Aún no hay productos en esta familia</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Estamos ampliando el catálogo. Vuelve pronto.
          </p>
        </div>
      )}
    </Container>
  );
}
