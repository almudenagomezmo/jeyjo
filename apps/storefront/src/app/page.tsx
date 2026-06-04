import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeProductCarousel } from "@/components/home/HomeProductCarousel";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";
import { SegmentCards } from "@/components/home/SegmentCards";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { listPublicProductsByIds } from "@/lib/catalog/fetch-product-list";
import { filterActiveBanners } from "@/lib/home/filter-banners";
import { fetchHomeMerchandising } from "@/lib/home/fetch-home";
import {
  featuredFromMerch,
  featuredFromNavRoots,
} from "@/lib/home/resolve-featured-categories";
import { carouselIdsForMode } from "@/lib/home/types";
import { getServerPriceMode } from "@/lib/price-mode-server";
import { resolvePriceQuotesBatch } from "@/lib/pricing/resolve-batch";
import { stockIndicatorsFromRows } from "@/lib/stock/get-stock-indicators-batch";

export default async function HomePage() {
  const priceMode = await getServerPriceMode();
  const merch = await fetchHomeMerchandising();
  const activeBanners = filterActiveBanners(merch.promoBanners, new Date(), priceMode);

  const { topSales: topSalesIds, eco: ecoIds } = carouselIdsForMode(merch, priceMode);

  const [topSalesRows, ecoRows] = await Promise.all([
    listPublicProductsByIds(topSalesIds),
    listPublicProductsByIds(ecoIds),
  ]);

  const allRows = [...topSalesRows, ...ecoRows];
  const quotesBySku = await resolvePriceQuotesBatch(allRows.map((r) => r.sku));
  const stockBySku = stockIndicatorsFromRows(allRows);

  let featured = featuredFromMerch(merch.featuredCategories);
  if (featured.length === 0) {
    const nav = await getNavigationTree();
    featured = featuredFromNavRoots(nav);
  }

  const topSalesHref = priceMode === "b2b" ? "/c/impresion" : "/c/escritura";
  const topSalesTitle =
    priceMode === "b2b" ? "Top ventas empresas" : "Top ventas esta semana";
  const topSalesSubtitle =
    priceMode === "b2b"
      ? "Referencias más pedidas por nuestros clientes B2B."
      : "Lo que más vendemos a particulares y empresas.";

  return (
    <div className="animate-fade-up">
      <HomeHero priceMode={priceMode} />
      <PromoBannerStrip banners={activeBanners} />
      <SegmentCards />
      <FeaturedCategories categories={featured} />
      <HomeProductCarousel
        title={topSalesTitle}
        subtitle={topSalesSubtitle}
        href={topSalesHref}
        cta="Ver todos"
        rows={topSalesRows}
        quotesBySku={quotesBySku}
        stockBySku={stockBySku}
      />
      <HomeProductCarousel
        title="Reciclaje y sostenibilidad"
        subtitle="Material para una oficina más limpia y consciente."
        href="/c/reciclaje"
        cta="Explorar gama eco"
        rows={ecoRows}
        quotesBySku={quotesBySku}
        stockBySku={stockBySku}
      />
      <TrustStrip />
    </div>
  );
}
