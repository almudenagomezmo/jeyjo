import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductTabs } from "@/components/product/ProductTabs";
import { StarIcon } from "@/components/ui/icons";
import { appendCrumb, buildBreadcrumbsFromPath } from "@/lib/catalog/build-breadcrumbs";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { getCategory } from "@/lib/data/categories";
import { PRODUCTS, getProduct, getRelatedProducts } from "@/lib/data/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const category = getCategory(product.categoryId);
  const related = getRelatedProducts(product);
  const tree = await getNavigationTree();
  const baseCrumbs = buildBreadcrumbsFromPath(tree, `/c/${product.categoryId}`);
  const crumbs = appendCrumb(baseCrumbs, product.name);

  return (
    <Container className="pt-6">
      <Breadcrumb items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <Card className="p-8">
            <ProductImage product={product} glyphSize={300} className="min-h-[360px]" />
          </Card>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={i}
                className={i === 0 ? "grid aspect-square place-items-center border-primary p-2" : "grid aspect-square place-items-center p-2 opacity-60"}
              >
                <ProductImage product={product} glyphSize={44} showEco={false} className="border-0 bg-transparent" />
              </Card>
            ))}
          </div>
        </div>

        {/* Info + buy */}
        <div>
          <p className="font-mono text-xs text-text-tertiary">
            {product.brand} · REF {product.ref}
            {product.oem ? ` · OEM ${product.oem}` : ""} · EAN {product.ean}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                  key={i}
                  size={14}
                  className={i <= Math.round(product.rating) ? "text-warning" : "text-border-strong"}
                  fill={i <= Math.round(product.rating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="text-[13px] font-semibold text-text-secondary">
              {product.rating}{" "}
              <span className="font-normal text-text-tertiary">({product.reviews} valoraciones)</span>
            </span>
          </div>

          <div className="mt-5">
            <ProductBuyBox product={product} />
          </div>
        </div>
      </div>

      <ProductTabs product={product} categoryName={category?.name ?? ""} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Productos relacionados</h2>
          <ProductGrid products={related} className="mt-5" />
        </section>
      )}
    </Container>
  );
}
