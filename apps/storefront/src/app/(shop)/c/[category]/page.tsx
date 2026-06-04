import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { buildBreadcrumbsFromPath } from "@/lib/catalog/build-breadcrumbs";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { CATEGORIES, getCategory } from "@/lib/data/categories";
import { getProductsByCategory } from "@/lib/data/products";

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  return { title: cat?.name ?? "Categoría" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const products = getProductsByCategory(cat.id);
  const tree = await getNavigationTree();
  const crumbs = buildBreadcrumbsFromPath(tree, `/c/${category}`);

  return (
    <Container className="pt-6">
      <Breadcrumb items={crumbs} />
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{cat.name}</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {products.length} productos en catálogo
        </p>
      </header>
      <ProductCatalog products={products} />
    </Container>
  );
}
