import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import type { HomeFeaturedCategory } from "@/lib/home/types";
import type { GlyphKind } from "@/lib/types";

function glyphFor(cat: HomeFeaturedCategory): GlyphKind {
  return cat.glyph ?? "box";
}

export function FeaturedCategories({ categories }: { categories: HomeFeaturedCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <Container className="pt-12">
      <HomeSectionHeader
        title="Explora por categoría"
        subtitle="Lo que más se pide en nuestras tiendas."
      />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            className="flex flex-col items-center gap-2.5 rounded-lg border border-border bg-surface p-4 transition-transform hover:-translate-y-0.5 hover:border-border-strong"
          >
            <span className="grid h-16 w-16 place-items-center rounded-md bg-surface-subtle">
              <ProductGlyph kind={glyphFor(cat)} size={42} />
            </span>
            <span className="text-center text-[13px] font-semibold leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
