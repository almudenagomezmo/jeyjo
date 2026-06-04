"use client";

import Link from "next/link";
import { serializePlpSearchParams } from "@/lib/plp/plp-search-params";
import type { PlpActiveFilters, PlpSortKey } from "@/lib/plp/types";

interface PlpPaginationProps {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  filters: PlpActiveFilters;
  sort: PlpSortKey;
  q?: string;
}

export function PlpPagination({
  basePath,
  page,
  pageSize,
  total,
  filters,
  sort,
  q,
}: PlpPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = serializePlpSearchParams({ filters, sort, page: p, q });
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginación">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:border-border-strong"
        >
          Anterior
        </Link>
      )}
      <span className="px-2 text-sm text-text-tertiary">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:border-border-strong"
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
