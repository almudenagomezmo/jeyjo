"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { ChevronRightIcon, CloseIcon } from "@/components/ui/icons";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";

interface MobileNavProps {
  open: boolean;
  tree: NavNode[];
  onClose: () => void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function MobileNav({ open, tree, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-[60] bg-ink/40 md:hidden"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de categorías"
        className="fixed inset-y-0 right-0 z-[65] flex w-[min(100%,320px)] flex-col border-l border-border-subtle bg-surface shadow-xl md:hidden"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <span className="text-sm font-bold">Categorías</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-muted"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4" aria-label="Categorías">
          <ul className="flex flex-col gap-1">
            {tree.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/c/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-md px-2 py-2 font-semibold hover:bg-surface-muted"
                >
                  {cat.glyph && (
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-subtle">
                      <ProductGlyph kind={cat.glyph} size={20} />
                    </span>
                  )}
                  {cat.title}
                </Link>
                {cat.children.length > 0 && (
                  <ul className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border-subtle pl-3">
                    {cat.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/c/${cat.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between rounded px-2 py-1.5 text-[13px] text-text-secondary hover:bg-surface-muted"
                        >
                          {sub.title}
                          <ChevronRightIcon size={12} className="text-text-tertiary" />
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className="ml-3 mt-0.5 flex flex-col gap-0.5">
                            {sub.children.map((family) => (
                              <li key={family.id}>
                                <Link
                                  href={`/c/${cat.slug}/${sub.slug}/${family.slug}`}
                                  onClick={onClose}
                                  className="block rounded px-2 py-1 text-[12px] text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
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
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
