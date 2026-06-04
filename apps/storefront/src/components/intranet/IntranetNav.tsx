"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INTRANET_PRIMARY_NAV } from "@/lib/intranet/navigation";
import { isIntranetNavItemActive } from "@/lib/intranet/nav-active";
import { cn } from "@/lib/utils/cn";

export function IntranetNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm" aria-label="Menú intranet">
      {INTRANET_PRIMARY_NAV.map((link) => {
        const active = isIntranetNavItemActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href === "/intranet/contabilidad" ? "/intranet/contabilidad/facturas" : link.href}
            className={cn(
              "rounded-md px-3 py-2 font-semibold transition-colors",
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
