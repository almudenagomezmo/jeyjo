"use client";

import { useEffect } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useUiStore } from "@/lib/store/ui-store";
import { headerPriceModeLabel } from "@/lib/utils/price";
import type { PriceMode } from "@/lib/types";

type PriceModeToggleProps = {
  sessionPriceMode?: PriceMode;
  locked?: boolean;
};

/**
 * Toggles between B2C and B2B price display. Validated B2B sessions use server-derived mode.
 */
export function PriceModeToggle({ sessionPriceMode, locked = false }: PriceModeToggleProps) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const setPriceMode = useUiStore((s) => s.setPriceMode);
  const toggle = useUiStore((s) => s.togglePriceMode);

  useEffect(() => {
    if (sessionPriceMode) setPriceMode(sessionPriceMode);
  }, [sessionPriceMode, setPriceMode]);

  const mode: PriceMode = sessionPriceMode ?? (hydrated ? priceMode : "b2c");

  if (locked && sessionPriceMode) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1.5 text-xs font-semibold text-text-secondary"
        title="Modo de precios según tu sesión"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: mode === "b2c" ? "var(--green-400)" : "var(--navy)" }}
        />
        {headerPriceModeLabel(mode)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Cambia el modo de visualización de precios"
      className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1.5 text-xs font-semibold text-text-secondary"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: mode === "b2c" ? "var(--green-400)" : "var(--navy)" }}
      />
      {headerPriceModeLabel(mode)}
    </button>
  );
}
