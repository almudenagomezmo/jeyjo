"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PriceQuote } from "@jeyjo/pricing";

import { computeCartSummary } from "@/lib/cart/compute-summary";
import type { CartSummary } from "@/lib/cart/types";
import type { CartProductSnapshot } from "@/lib/cart/types";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { DEFAULT_SHIPPING_RULES, type ShippingRules } from "@/lib/system-config/defaults";
import type { CartLine, PriceMode } from "@/lib/types";

const EMPTY_SUMMARY = (mode: PriceMode, rules = DEFAULT_SHIPPING_RULES): CartSummary => ({
  lines: [],
  itemCount: 0,
  subtotal: 0,
  shippingThreshold: rules[mode].threshold,
  shippingCost: 0,
  amountToFreeShipping: 0,
  total: 0,
  mode,
});

async function fetchShippingRulesClient(): Promise<ShippingRules> {
  try {
    const res = await fetch("/api/system/config");
    if (!res.ok) return DEFAULT_SHIPPING_RULES;
    const body = (await res.json()) as { shipping?: ShippingRules };
    return body.shipping ?? DEFAULT_SHIPPING_RULES;
  } catch {
    return DEFAULT_SHIPPING_RULES;
  }
}

export async function fetchCartSummaryData(
  lines: CartLine[],
  mode: PriceMode,
): Promise<CartSummary> {
  if (lines.length === 0) return EMPTY_SUMMARY(mode);

  const ids = [...new Set(lines.map((l) => l.productId))];

  const [productsRes, shippingRules] = await Promise.all([
    fetch("/api/catalog/cart-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: ids }),
    }),
    fetchShippingRulesClient(),
  ]);

  let products: CartProductSnapshot[] = [];
  if (productsRes.ok) {
    const body = (await productsRes.json()) as { products?: CartProductSnapshot[] };
    products = body.products ?? [];
  }

  const skus = products.map((p) => p.skuErp).filter(Boolean);
  let quotes: Record<string, PriceQuote> = {};

  if (skus.length > 0) {
    const pricingRes = await fetch("/api/pricing/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus }),
    });
    if (pricingRes.ok) {
      const body = (await pricingRes.json()) as {
        quotes?: Record<string, PriceQuote>;
        priceMode?: PriceMode;
      };
      quotes = body.quotes ?? {};
    }
  }

  return computeCartSummary(lines, products, quotes, mode, shippingRules);
}

export function useCartSummary() {
  const lines = useCartStore((s) => s.lines);
  const priceMode = useUiStore((s) => s.priceMode);
  const debouncedLines = useDebouncedValue(lines, 300);
  const lineKey = useMemo(() => JSON.stringify(debouncedLines), [debouncedLines]);

  const [summary, setSummary] = useState<CartSummary>(() => EMPTY_SUMMARY(priceMode));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (debouncedLines.length === 0) {
      setSummary(EMPTY_SUMMARY(priceMode));
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await fetchCartSummaryData(debouncedLines, priceMode);
      setSummary(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el carrito");
    } finally {
      setLoading(false);
    }
  }, [debouncedLines, priceMode]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (debouncedLines.length === 0) {
        setSummary(EMPTY_SUMMARY(priceMode));
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const next = await fetchCartSummaryData(debouncedLines, priceMode);
        if (!cancelled) setSummary(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar el carrito");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lineKey, priceMode, debouncedLines]);

  const hasLines = lines.length > 0;

  return {
    summary,
    loading: loading && hasLines,
    error,
    refresh,
    isEmpty: !hasLines,
    pricedLineCount: summary.lines.filter((l) => !l.unavailable).length,
  };
}
