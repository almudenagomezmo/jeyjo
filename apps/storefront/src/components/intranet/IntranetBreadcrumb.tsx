"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildIntranetBreadcrumbs } from "@/lib/intranet/breadcrumbs";

export function IntranetBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildIntranetBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-text-secondary">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="font-semibold text-text-primary" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-text-brand">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
