import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import type { HomePromoBanner } from "@/lib/home/types";

export function PromoBannerStrip({ banners }: { banners: HomePromoBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <Container className="pt-8">
      <div
        className={
          banners.length === 1
            ? "grid gap-3"
            : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {banners.map((banner, index) => {
          const title = banner.alt?.trim();
          return (
            <Link
              key={banner.id ?? `${banner.href}-${index}`}
              href={banner.href}
              className="group relative overflow-hidden rounded-lg border border-border bg-surface-subtle transition-transform hover:-translate-y-0.5 hover:border-border-strong"
            >
              {banner.imageUrl ? (
                <>
                  <Image
                    src={banner.imageUrl}
                    alt={title ?? "Promoción"}
                    width={640}
                    height={240}
                    className="h-36 w-full object-cover transition-transform group-hover:scale-[1.02] sm:h-40"
                    unoptimized
                  />
                  {title ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/45 to-transparent px-4 pb-3 pt-10">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-0">
                        {title}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-36 items-center justify-center bg-primary-soft px-4 text-center text-sm font-semibold text-text-brand sm:h-40">
                  {title ?? "Promoción"}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
