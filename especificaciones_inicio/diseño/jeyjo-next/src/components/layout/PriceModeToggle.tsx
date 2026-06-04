"use client";

import { useHydrated } from "@/lib/hooks/useHydrated";
import { useUiStore } from "@/lib/store/ui-store";

/**
 * Toggles between B2C (VAT-inclusive emphasis) and B2B (ex-VAT emphasis)
 * price display. In a real app this would be derived from the authenticated
 * customer's group rather than a manual switch.
 */
export function PriceModeToggle() {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const toggle = useUiStore((s) => s.togglePriceMode);
  const mode = hydrated ? priceMode : "b2c";

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
      Precios {mode === "b2c" ? "con IVA" : "sin IVA (B2B)"}
    </button>
  );
}
