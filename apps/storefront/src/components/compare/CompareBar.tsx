"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { COMPARE_MIN_HINT } from "@/lib/compare/constants";
import { isCompareEnabled } from "@/lib/compare/is-compare-enabled";
import { buildCompareUrl } from "@/lib/compare/parse-compare-skus";
import { useCompareStore } from "@/lib/store/compare-store";
import { cn } from "@/lib/utils/cn";

export function CompareBar() {
  const router = useRouter();
  const items = useCompareStore((s) => s.items);
  const limitMessage = useCompareStore((s) => s.limitMessage);
  const clear = useCompareStore((s) => s.clear);
  const remove = useCompareStore((s) => s.remove);
  const clearLimitMessage = useCompareStore((s) => s.clearLimitMessage);

  useEffect(() => {
    if (!limitMessage) return;
    const timer = window.setTimeout(() => clearLimitMessage(), 5000);
    return () => window.clearTimeout(timer);
  }, [limitMessage, clearLimitMessage]);

  if (!isCompareEnabled() || items.length === 0) return null;

  const canCompare = items.length >= 2;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-[0_-4px_16px_rgba(28,27,23,0.08)] backdrop-blur-sm"
      role="region"
      aria-label="Comparar productos"
    >
      {limitMessage ? (
        <p className="bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning-text" role="alert">
          {limitMessage}
        </p>
      ) : null}

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <p className="text-sm font-semibold text-text">
          {items.length} de 3
        </p>

        <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <li
              key={item.sku}
              className="relative flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface-muted px-2 py-1"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded bg-surface">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[10px] text-text-tertiary">
                    {item.sku.slice(0, 4)}
                  </span>
                )}
              </div>
              <span className="max-w-[120px] truncate text-xs font-medium">{item.title}</span>
              <button
                type="button"
                onClick={() => remove(item.sku)}
                className="rounded px-1 text-xs text-text-tertiary hover:text-text"
                aria-label={`Quitar ${item.title} de la comparación`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {!canCompare ? (
            <span className="hidden text-xs text-text-tertiary sm:inline">{COMPARE_MIN_HINT}</span>
          ) : null}
          <button
            type="button"
            onClick={() => clear()}
            className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text"
          >
            Limpiar
          </button>
          <button
            type="button"
            disabled={!canCompare}
            onClick={() => router.push(buildCompareUrl(items.map((i) => i.sku)))}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold",
              canCompare
                ? "bg-primary text-on-primary hover:opacity-90"
                : "cursor-not-allowed bg-surface-muted text-text-tertiary",
            )}
            aria-disabled={!canCompare}
            title={!canCompare ? COMPARE_MIN_HINT : undefined}
          >
            Comparar
          </button>
        </div>
      </div>
    </div>
  );
}
