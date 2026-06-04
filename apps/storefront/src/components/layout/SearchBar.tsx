"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { ProductImage } from "@/components/ui/ProductImage";
import { SearchIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import { getPriceView, getDualPrice } from "@/lib/utils/price";
import { searchCategories, searchProducts } from "@/lib/utils/search";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const mode = hydrated ? priceMode : "b2c";

  const products = query.length >= 2 ? searchProducts(query, 6) : [];
  const categories = query.length >= 2 ? searchCategories(query, 4) : [];
  const showResults = open && query.length >= 2;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Busca por nombre, referencia o EAN…"
        iconStart={<SearchIcon size={16} />}
        className="h-11"
        aria-label="Buscar productos"
      />

      {showResults && (
        <div className="animate-fade-up absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-auto rounded-lg border border-border bg-surface shadow-xl">
          {products.length === 0 && categories.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-tertiary">
              No hay resultados para «{query}». Prueba con otra palabra.
            </div>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="px-4 pb-1 pt-3">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                    Categorías sugeridas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium hover:bg-surface-hover"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {products.length > 0 && (
                <div className="p-2">
                  <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                    Productos
                  </p>
                  {products.map((p) => {
                    const dual = getDualPrice(getPriceView(p), mode);
                    return (
                      <Link
                        key={p.id}
                        href={`/p/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-muted"
                      >
                        <ProductImage product={p} glyphSize={28} className="h-11 w-11" showEco={false} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">{p.name}</p>
                          <p className="font-mono text-[11px] text-text-tertiary">
                            {p.ref} · {p.brand}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatMoney(dual.primary)}</p>
                          <p className="text-[10px] text-text-tertiary">{dual.primaryLabel}</p>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    onClick={submit}
                    className="mt-1 block w-full border-t border-border-subtle px-2 py-2.5 text-left text-xs font-semibold text-text-brand"
                  >
                    Ver todos los resultados para «{query}» →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
