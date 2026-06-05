"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";

interface MegaMenuProps {
  open: boolean;
  tree: NavNode[];
  onClose: () => void;
}

export function MegaMenu({ open, tree, onClose }: MegaMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-40 bg-ink/25"
        onClick={onClose}
      />
      <div className="animate-fade-up absolute left-0 right-0 top-full z-[45] border-b border-border bg-surface shadow-xl">
        <Container className="py-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
            {tree.map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/c/${cat.slug}`}
                  onClick={onClose}
                  className="mb-3 flex items-center gap-2 font-bold"
                >
                  {cat.glyph && (
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-subtle">
                      <ProductGlyph kind={cat.glyph} size={24} />
                    </span>
                  )}
                  <span className="text-[13px]">{cat.title}</span>
                </Link>
                <ul className="flex flex-col gap-1">
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/c/${cat.slug}/${sub.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between rounded px-2 py-1 text-[13px] text-text-secondary hover:bg-surface-muted"
                      >
                        {sub.title}
                        <ChevronRightIcon size={12} className="text-text-tertiary" />
                      </Link>
                      {sub.children.length > 0 && (
                        <ul className="ml-2 mt-0.5 flex flex-col gap-0.5">
                          {sub.children.map((family) => (
                            <li key={family.id}>
                              <Link
                                href={`/c/${cat.slug}/${sub.slug}/${family.slug}`}
                                onClick={onClose}
                                className="block rounded px-2 py-0.5 text-[12px] text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
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
              </div>
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}
