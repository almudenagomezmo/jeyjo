"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/cuenta", label: "Mi cuenta" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/perfil", label: "Perfil" },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm" aria-label="Área de cliente">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
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
