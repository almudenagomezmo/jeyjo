"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchBar } from "@/components/layout/SearchBar";
import { HeaderAccountLink } from "@/components/layout/HeaderAccountLink";
import { PriceModeToggle } from "@/components/layout/PriceModeToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { CartIcon, ChevronDownIcon, MenuIcon } from "@/components/ui/icons";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";
import { selectCartCount, useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

interface HeaderProps {
  tree: NavNode[];
  accountHref?: string;
  accountLabel?: string;
  sessionPriceMode?: "b2c" | "b2b";
  priceModeLocked?: boolean;
}

export function Header({
  tree,
  accountHref = "/login",
  accountLabel = "Acceder",
  sessionPriceMode,
  priceModeLocked = false,
}: HeaderProps) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" aria-label="Inicio" className="shrink-0">
          <Logo size={26} color="var(--text)" />
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold hover:bg-surface-muted md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Abrir menú de categorías"
        >
          <MenuIcon size={20} />
        </button>

        <button
          type="button"
          onClick={() => setMegaOpen((o) => !o)}
          onMouseEnter={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) setMegaOpen(true);
          }}
          className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-surface-muted md:inline-flex"
          aria-expanded={megaOpen}
        >
          <MenuIcon size={18} /> Categorías
          <ChevronDownIcon size={14} className="text-text-tertiary" />
        </button>

        <div className="flex flex-1 justify-center">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden lg:block">
            <PriceModeToggle sessionPriceMode={sessionPriceMode} locked={priceModeLocked} />
          </div>
          <ThemeToggle />
          <HeaderAccountLink href={accountHref} label={accountLabel} />
          <button
            type="button"
            onClick={() => setMiniCartOpen(true)}
            aria-label="Abrir carrito"
            className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-surface-muted"
          >
            <CartIcon size={20} />
            {hydrated && count > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </Container>

      <MegaMenu open={megaOpen} tree={tree} onClose={() => setMegaOpen(false)} />
      <MobileNav open={mobileOpen} tree={tree} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
