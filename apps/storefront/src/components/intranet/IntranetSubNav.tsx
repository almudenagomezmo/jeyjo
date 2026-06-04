"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTABILIDAD_SUBNAV } from "@/lib/intranet/navigation";
import { isIntranetNavItemActive } from "@/lib/intranet/nav-active";
import { cn } from "@/lib/utils/cn";

export function IntranetSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border-subtle pb-4" aria-label="Contabilidad">
      {CONTABILIDAD_SUBNAV.map((link) => {
        const active = isIntranetNavItemActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              active ? "bg-primary-soft text-text-brand" : "text-text-secondary hover:bg-surface-muted",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
