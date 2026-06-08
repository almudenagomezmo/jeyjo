"use client";

import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { ProductReviewPublic } from "@/lib/reviews/types";

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function ProductReviewsList({ reviews }: { reviews: ProductReviewPublic[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        Aún no hay valoraciones publicadas para este producto.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-lg border border-border-subtle p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-text">{review.authorDisplayName}</span>
            <span className="text-xs text-text-tertiary">{formatRelativeDate(review.createdAt)}</span>
          </div>
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon
                key={i}
                size={12}
                className={cn(i <= review.rating ? "text-warning" : "text-border-strong")}
                fill={i <= review.rating ? "currentColor" : "none"}
              />
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
