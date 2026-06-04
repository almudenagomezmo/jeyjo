import { cn } from "@/lib/utils/cn";

interface StockBadgeProps {
  stock: number;
  packSize?: number;
  className?: string;
}

export function StockBadge({ stock, packSize, className }: StockBadgeProps) {
  let dot = "bg-success";
  let label = "En stock";
  if (stock === 0) {
    dot = "bg-danger";
    label = "Sin stock";
  } else if (stock <= 5) {
    dot = "bg-warning";
    label = `Últimas ${stock} unidades`;
  } else if (stock <= 20) {
    dot = "bg-info";
    label = "Stock limitado";
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary", className)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
      {packSize && packSize > 1 && stock > 0 && (
        <span className="text-text-tertiary">· envase {packSize} ud.</span>
      )}
    </span>
  );
}
