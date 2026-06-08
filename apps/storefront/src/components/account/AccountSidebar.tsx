"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_STOCK_WATCHES_NAV } from "@/lib/account/navigation";
import type { IntranetNavItem } from "@/lib/intranet/navigation";
import { cn } from "@/lib/utils/cn";

const PERSONAL_LINKS = [
  { href: "/cuenta", label: "Mi cuenta" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/cuenta/presupuestos", label: "Mis presupuestos" },
  { href: ACCOUNT_STOCK_WATCHES_NAV.href, label: ACCOUNT_STOCK_WATCHES_NAV.label },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/perfil", label: "Perfil" },
] as const;

type AccountSidebarProps = {
  empresaLinks?: IntranetNavItem[];
};

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/cuenta") {
    return pathname === "/cuenta";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = isLinkActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 font-semibold transition-colors",
        active ? "bg-primary-soft text-text-brand" : "text-text-secondary hover:bg-surface-muted",
      )}
    >
      {label}
    </Link>
  );
}

function SidebarSection({
  title,
  children,
  separated = false,
}: {
  title: string;
  children: React.ReactNode;
  separated?: boolean;
}) {
  return (
    <section
      className={cn(separated && "border-t border-border-subtle pt-6")}
      aria-labelledby={`sidebar-${title.toLowerCase()}`}
    >
      <h2
        id={`sidebar-${title.toLowerCase()}`}
        className="mb-3 px-3 text-xs font-semibold text-text-tertiary"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function AccountSidebar({ empresaLinks = [] }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 text-sm" aria-label="Área de cliente">
      <SidebarSection title="Personal">
        {PERSONAL_LINKS.map((link) => (
          <SidebarLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
        ))}
      </SidebarSection>

      {empresaLinks.length > 0 && (
        <SidebarSection title="Empresa" separated>
          {empresaLinks.map((link) => (
            <SidebarLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </SidebarSection>
      )}
    </nav>
  );
}
