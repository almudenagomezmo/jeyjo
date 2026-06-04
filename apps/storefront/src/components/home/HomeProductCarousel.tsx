import { Container } from "@/components/layout/Container";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { ProductCard } from "@/components/product/ProductCard";
import type { PriceQuote } from "@jeyjo/pricing";
import type { PlpProductRow } from "@/lib/plp/types";
import type { PublicStockIndicator } from "@/lib/stock/types";

export function HomeProductCarousel({
  title,
  subtitle,
  href,
  cta,
  rows,
  quotesBySku,
  stockBySku,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
  rows: PlpProductRow[];
  quotesBySku: Record<string, PriceQuote>;
  stockBySku: Record<string, PublicStockIndicator>;
}) {
  if (rows.length === 0) return null;

  return (
    <Container className="pt-14">
      <HomeSectionHeader title={title} subtitle={subtitle} href={href} cta={cta} />
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {rows.map((row) => (
          <div key={row.sku} className="w-[min(100%,220px)] shrink-0 snap-start sm:w-[200px]">
            <ProductCard
              row={row}
              quote={quotesBySku[row.sku]}
              stock={stockBySku[row.sku]}
            />
          </div>
        ))}
      </div>
    </Container>
  );
}
