import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { CATEGORIES, getCategory } from "@/lib/data/categories";
import { getProductsByCategory } from "@/lib/data/products";

interface PageProps {
  params: Promise<{ category: string; sub: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => ({ category: c.id, sub: s.id })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, sub } = await params;
  const cat = getCategory(category);
  const subcat = cat?.subcategories.find((s) => s.id === sub);
  return { title: subcat ? `${subcat.name} · ${cat?.name}` : "Categoría" };
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { category, sub } = await params;
  const cat = getCategory(category);
  const subcat = cat?.subcategories.find((s) => s.id === sub);
  if (!cat || !subcat) notFound();

  const products = getProductsByCategory(cat.id, subcat.id);

  return (
    <Container className="pt-6">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: cat.name, href: `/c/${cat.id}` },
          { label: subcat.name },
        ]}
      />
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{subcat.name}</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {products.length} {products.length === 1 ? "producto" : "productos"} en {cat.name.toLowerCase()}
        </p>
      </header>
      {products.length > 0 ? (
        <ProductCatalog products={products} />
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong p-12 text-center">
          <p className="font-bold">Aún no hay productos en esta subcategoría</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Estamos ampliando el catálogo. Vuelve pronto.
          </p>
        </div>
      )}
    </Container>
  );
}
