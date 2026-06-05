"use client";

import { useCallback, useRef, useState } from "react";

import { Card } from "@/components/ui/Card";
import { ProductImage } from "@/components/ui/ProductImage";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

type ProductImageGalleryProps = {
  galleryUrls: string[];
  glyphProduct: Pick<Product, "glyph" | "colors" | "eco">;
  title: string;
};

const SWIPE_THRESHOLD_PX = 40;

export function ProductImageGallery({
  galleryUrls,
  glyphProduct,
  title,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const imageCount = galleryUrls.length;
  const activeUrl = galleryUrls[activeIndex] ?? galleryUrls[0] ?? null;
  const showCarousel = imageCount > 1;

  const goTo = useCallback(
    (index: number) => {
      if (imageCount === 0) return;
      const next = ((index % imageCount) + imageCount) % imageCount;
      setActiveIndex(next);
    },
    [imageCount],
  );

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!showCarousel) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;

    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return (
    <div>
      <Card
        className="relative p-8"
        role={showCarousel ? "region" : undefined}
        aria-label={showCarousel ? "Galería de imágenes del producto" : undefined}
        tabIndex={showCarousel ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onTouchStart={showCarousel ? handleTouchStart : undefined}
        onTouchEnd={showCarousel ? handleTouchEnd : undefined}
      >
        {showCarousel && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              onClick={goPrev}
              aria-label="Imagen anterior"
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              onClick={goNext}
              aria-label="Imagen siguiente"
            >
              <ChevronRightIcon size={20} />
            </button>
            <span className="absolute bottom-3 right-3 z-10 rounded-md bg-surface/90 px-2 py-1 text-xs font-medium text-text-secondary">
              {activeIndex + 1} / {imageCount}
            </span>
          </>
        )}

        <ProductImage
          product={glyphProduct}
          imageUrl={activeUrl}
          glyphSize={300}
          className="min-h-[360px]"
          alt={`${title}${showCarousel ? ` — imagen ${activeIndex + 1} de ${imageCount}` : ""}`}
          priority={activeIndex === 0}
        />
      </Card>

      {showCarousel && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {galleryUrls.map((url, index) => (
            <Card
              key={`${url}-${index}`}
              className={cn(
                "aspect-square overflow-hidden p-2",
                index === activeIndex ? "border-primary" : "opacity-60",
              )}
            >
              <button
                type="button"
                className="block h-full w-full"
                onClick={() => goTo(index)}
                aria-label={`Ver imagen ${index + 1} de ${imageCount}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <ProductImage
                  product={glyphProduct}
                  imageUrl={url}
                  glyphSize={44}
                  showEco={false}
                  variant="thumb"
                  alt=""
                />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
