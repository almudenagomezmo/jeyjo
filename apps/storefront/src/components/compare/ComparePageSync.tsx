"use client";

import { useEffect } from "react";

import type { CompareItem } from "@/lib/store/compare-store";
import { useCompareStore } from "@/lib/store/compare-store";

export function ComparePageSync({
  validItems,
  showInvalidWarning,
}: {
  validItems: CompareItem[];
  showInvalidWarning: boolean;
}) {
  const setItems = useCompareStore((s) => s.setItems);

  useEffect(() => {
    setItems(validItems);
  }, [validItems, setItems]);

  if (!showInvalidWarning) return null;

  return (
    <p
      className="mb-4 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-primary"
      role="alert"
    >
      Algunos productos ya no están disponibles o no son válidos para comparar. Se
      muestran solo los productos publicados encontrados.
    </p>
  );
}
