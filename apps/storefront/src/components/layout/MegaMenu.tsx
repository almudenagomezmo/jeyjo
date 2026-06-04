"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { ChevronRightIcon } from "@/components/ui/icons";
import { CATEGORIES } from "@/lib/data/categories";

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MegaMenu({ open, onClose }: MegaMenuProps) {
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
        aria-label="Cerrar menú"
        className="fixed inset-0 z-40 bg-ink/25"
        onClick={onClose}
      />
      <div className="animate-fade-up absolute left-0 right-0 top-full z-[45] border-b border-border bg-surface shadow-xl">
        <Container className="py-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/c/${cat.id}`}
                  onClick={onClose}
                  className="mb-3 flex items-center gap-2 font-bold"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-subtle">
                    <ProductGlyph kind={cat.glyph} size={24} />
                  </span>
                  <span className="text-[13px]">{cat.name}</span>
                </Link>
                <ul className="flex flex-col gap-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/c/${cat.id}/${sub.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between rounded px-2 py-1 text-[13px] text-text-secondary hover:bg-surface-muted"
                      >
                        {sub.name}
                        <ChevronRightIcon size={12} className="text-text-tertiary" />
                      </Link>
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
