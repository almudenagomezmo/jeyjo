import { cn } from "@/lib/utils/cn";
import type { PublicStockIndicator } from "@/lib/stock/types";

interface StockBadgeProps {
  stock: number;
  packSize?: number;
  className?: string;
}

/** Legacy numeric stock badge (PDP demo). Prefer {@link StockIndicatorBadge} on PLP. */
export function StockBadge({ stock, packSize, className }: StockBadgeProps) {
  let dotClass = "bg-[var(--stock-available)]";
  let label = "En stock";
  if (stock === 0) {
    dotClass = "bg-[var(--stock-limited)]";
    label = "Sin stock";
  } else if (stock <= 5) {
    dotClass = "bg-[var(--stock-low)]";
    label = `Últimas ${stock} unidades`;
  } else if (stock <= 20) {
    dotClass = "bg-[var(--stock-low)]";
    label = "Stock limitado";
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary", className)}>
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
      {packSize && packSize > 1 && stock > 0 && (
        <span className="text-text-tertiary">· envase {packSize} ud.</span>
      )}
    </span>
  );
}

const LEVEL_DOT: Record<PublicStockIndicator["level"], string> = {
  available: "bg-[var(--stock-available)]",
  low: "bg-[var(--stock-low)]",
  limited: "bg-[var(--stock-limited)]",
};

export function StockIndicatorBadge({
  indicator,
  packSize,
  className,
}: {
  indicator: PublicStockIndicator;
  packSize?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary", className)}>
      <span className={cn("h-2 w-2 rounded-full", LEVEL_DOT[indicator.level])} />
      {indicator.label}
      {packSize && packSize > 1 && indicator.level !== "limited" && (
        <span className="text-text-tertiary">· envase {packSize} ud.</span>
      )}
    </span>
  );
}
