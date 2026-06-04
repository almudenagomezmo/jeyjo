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
        {banners.map((banner, index) => (
          <Link
            key={banner.id ?? `${banner.href}-${index}`}
            href={banner.href}
            className="group relative overflow-hidden rounded-lg border border-border bg-surface-subtle transition-transform hover:-translate-y-0.5 hover:border-border-strong"
          >
            {banner.imageUrl ? (
              <Image
                src={banner.imageUrl}
                alt={banner.alt ?? ""}
                width={640}
                height={240}
                className="h-36 w-full object-cover sm:h-40"
                unoptimized
              />
            ) : (
              <div className="flex h-36 items-center justify-center bg-primary-soft text-sm font-semibold text-text-brand sm:h-40">
                {banner.alt ?? "Promoción"}
              </div>
            )}
          </Link>
        ))}
      </div>
    </Container>
  );
}
