"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { ProductImage } from "@/components/ui/ProductImage";
import { ChevronRightIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";

type MegaMenuFeatured = {
  slug: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  priceWithVat: number;
  brand: string;
  glyph: "box";
  colors: [string, string];
  eco: boolean;
};

interface MegaMenuProps {
  open: boolean;
  tree: NavNode[];
  onClose: () => void;
}

export function MegaMenu({ open, tree, onClose }: MegaMenuProps) {
  const [activeId, setActiveId] = useState(tree[0]?.id ?? "");
  const [subcounts, setSubcounts] = useState<Record<string, number>>({});
  const [featured, setFeatured] = useState<MegaMenuFeatured[]>([]);
  const [loading, setLoading] = useState(false);

  const activeCategory = tree.find((node) => node.id === activeId) ?? tree[0] ?? null;

  useEffect(() => {
    if (!tree.some((node) => node.id === activeId)) {
      setActiveId(tree[0]?.id ?? "");
    }
  }, [tree, activeId]);

  const loadPanel = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/navigation/mega-menu?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setSubcounts({});
        setFeatured([]);
        return;
      }
      const data = (await res.json()) as {
        subcounts?: Record<string, number>;
        featured?: MegaMenuFeatured[];
      };
      setSubcounts(data.subcounts ?? {});
      setFeatured(data.featured ?? []);
    } catch {
      setSubcounts({});
      setFeatured([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !activeCategory) return;
    void loadPanel(activeCategory.slug);
  }, [open, activeCategory, loadPanel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || tree.length === 0 || !activeCategory) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-40 bg-ink/25"
        onClick={onClose}
      />
      <div className="animate-fade-up absolute left-0 right-0 top-full z-[45] border-b border-border bg-surface shadow-xl">
        <Container className="py-0">
          <div className="flex min-h-[22rem]">
            <aside className="w-56 shrink-0 border-r border-border-subtle py-5 pr-2">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                Categorías
              </p>
              <ul className="flex flex-col gap-0.5">
                {tree.map((cat) => {
                  const isActive = cat.id === activeCategory.id;
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(cat.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[13px] font-semibold transition-colors",
                          isActive
                            ? "bg-surface-muted text-text"
                            : "text-text-secondary hover:bg-surface-subtle hover:text-text",
                        )}
                      >
                        <span>{cat.title}</span>
                        {isActive && (
                          <ChevronRightIcon size={14} className="shrink-0 text-text-tertiary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className="flex min-w-0 flex-1">
              <div className="min-w-0 flex-1 px-6 py-5">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-bold">{activeCategory.title}</h2>
                  <Link
                    href={`/c/${activeCategory.slug}`}
                    onClick={onClose}
                    className="shrink-0 text-[13px] font-semibold text-text-brand hover:underline"
                  >
                    Ver todo →
                  </Link>
                </div>

                {activeCategory.children.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
                    {activeCategory.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/c/${activeCategory.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between rounded-md px-2 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
                        >
                          <span>{sub.title}</span>
                          <span className="tabular text-text-tertiary">
                            {loading ? "…" : (subcounts[sub.slug] ?? 0)}
                          </span>
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className="mb-1 ml-2 flex flex-col">
                            {sub.children.map((family) => (
                              <li key={family.id}>
                                <Link
                                  href={`/c/${activeCategory.slug}/${sub.slug}/${family.slug}`}
                                  onClick={onClose}
                                  className="block rounded-md px-2 py-1 text-[12px] text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
                                >
                                  {family.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-tertiary">
                    Explora todos los productos de esta categoría.
                  </p>
                )}
              </div>

              <aside className="w-72 shrink-0 border-l border-border-subtle px-5 py-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                  Destacados
                </p>
                {loading && featured.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Cargando…</p>
                ) : featured.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Sin productos destacados.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {featured.map((product) => (
                      <li key={product.sku}>
                        <Link
                          href={`/p/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-muted"
                        >
                          <ProductImage
                            product={{
                              glyph: product.glyph,
                              colors: product.colors,
                              eco: product.eco,
                            }}
                            imageUrl={product.imageUrl}
                            variant="thumb"
                            glyphSize={36}
                            showEco={false}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-[13px] font-semibold leading-snug">
                              {product.title}
                            </p>
                            <p className="mt-0.5 text-sm font-bold tabular">
                              {formatMoney(product.priceWithVat)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
