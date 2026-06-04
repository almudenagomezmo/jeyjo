import { notFound, permanentRedirect } from "next/navigation";
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
import { listPublishedProductSlugs } from "@/lib/catalog/fetch-product-pdp";
import { loadPdpPage } from "@/lib/pdp/load-pdp-page";
import { buildPdpMetadataFromView, buildProductJsonLdFromView } from "@/lib/seo/pdp-metadata";
import { plpRowToProduct } from "@/lib/plp/row-to-product";

export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const slugs = await listPublishedProductSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const payload = await loadPdpPage(id);
  if (!payload) return { title: "Producto no encontrado" };
  const { product } = payload;
  return buildPdpMetadataFromView(product);
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await loadPdpPage(id);
  if (!payload) notFound();

  if (payload.redirectToSlug) {
    permanentRedirect(`/p/${payload.redirectToSlug}`);
  }

  const { product, quote, stock, relatedRows, quotesBySku, stockBySku } = payload;
  const tree = await getNavigationTree();
  const categorySlug = product.categorySlugs[0] ?? "general";
  const baseCrumbs = buildBreadcrumbsFromPath(tree, `/c/${categorySlug}`);
  const crumbs = appendCrumb(baseCrumbs, product.title);

  const glyphProduct = plpRowToProduct({
    sku: product.sku,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    facetColor: null,
    facetMaterial: null,
    ecoLabel: product.ecoLabel,
    categorySlugs: product.categorySlugs,
    packUnit: product.packUnit,
    vatRate: product.vatRate,
    stockIndicator: stock.level,
    allowOrderWithoutStock: stock.allowOrderWithoutStock,
    rating: product.rating ?? 0,
    reviews: product.reviews ?? 0,
    hasOffer: false,
    imageUrl: product.imageUrl,
  });

  const showRating = product.rating != null && product.reviews != null && product.reviews > 0;
  const productJsonLd = buildProductJsonLdFromView(product);

  return (
    <Container className="pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Breadcrumb items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <Card className="p-8">
            <ProductImage
              product={glyphProduct}
              imageUrl={product.imageUrl}
              glyphSize={300}
              className="min-h-[360px]"
              alt={product.title}
            />
          </Card>
          <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={i}
                className={
                  i === 0
                    ? "grid aspect-square place-items-center border-primary p-2"
                    : "grid aspect-square place-items-center p-2 opacity-60"
                }
              >
                <ProductImage
                  product={glyphProduct}
                  imageUrl={product.imageUrl}
                  glyphSize={44}
                  showEco={false}
                  className="border-0 bg-transparent"
                  alt=""
                />
              </Card>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs text-text-tertiary">
            {product.brand} · REF {product.sku}
            {product.oem ? ` · OEM ${product.oem}` : ""}
            {product.ean ? ` · EAN ${product.ean}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
            {product.title}
          </h1>

          {showRating && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon
                    key={i}
                    size={14}
                    className={
                      i <= Math.round(product.rating!) ? "text-warning" : "text-border-strong"
                    }
                    fill={i <= Math.round(product.rating!) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-[13px] font-semibold text-text-secondary">
                {product.rating}{" "}
                <span className="font-normal text-text-tertiary">
                  ({product.reviews} valoraciones)
                </span>
              </span>
            </div>
          )}

          <div className="mt-5">
            <ProductBuyBox
              productId={product.slug}
              sku={product.sku}
              refLabel={product.sku}
              packUnit={product.packUnit}
              quote={quote}
              stock={stock}
              vatRate={product.vatRate}
            />
          </div>
        </div>
      </div>

      <ProductTabs
        longDescriptionHtml={product.longDescriptionHtml}
        specRows={product.specRows}
        attachments={product.attachments}
      />

      {relatedRows.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Productos relacionados</h2>
          <ProductGrid
            className="mt-5"
            plpItems={relatedRows.map((row) => ({
              row,
              quote: quotesBySku[row.sku],
              stock: stockBySku[row.sku],
            }))}
          />
        </section>
      )}
    </Container>
  );
}
