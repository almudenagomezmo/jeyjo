"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store/ui-store";
import type { PriceMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function HomeSegmentToggle({ initialMode }: { initialMode: PriceMode }) {
  const router = useRouter();
  const priceMode = useUiStore((s) => s.priceMode);
  const setPriceMode = useUiStore((s) => s.setPriceMode);
  const active = priceMode ?? initialMode;

  useEffect(() => {
    setPriceMode(initialMode);
  }, [initialMode, setPriceMode]);

  function select(mode: PriceMode) {
    if (mode === active) return;
    setPriceMode(mode);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label="Segmento de precios"
      className="inline-flex rounded-full border border-border bg-surface-muted p-1"
    >
      {(
        [
          { mode: "b2c" as const, label: "Particulares (B2C)" },
          { mode: "b2b" as const, label: "Empresas (B2B)" },
        ] as const
      ).map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => select(mode)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            active === mode
              ? "bg-primary text-on-primary"
              : "text-text-secondary hover:text-text",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
