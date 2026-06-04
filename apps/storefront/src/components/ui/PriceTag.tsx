import { formatMoney } from "@/lib/utils/format";
import { getDualPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils/cn";
import type { PriceMode, PriceView } from "@/lib/types";

type PriceSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<PriceSize, { primary: string; secondary: string }> = {
  sm: { primary: "text-base", secondary: "text-[11px]" },
  md: { primary: "text-xl", secondary: "text-xs" },
  lg: { primary: "text-3xl", secondary: "text-[13px]" },
  xl: { primary: "text-4xl", secondary: "text-sm" },
};

interface PriceTagProps {
  view: PriceView;
  mode: PriceMode;
  vat: number;
  size?: PriceSize;
  className?: string;
}

/** Dual price display honouring the B2C / B2B emphasis rule. */
export function PriceTag({ view, mode, vat, size = "md", className }: PriceTagProps) {
  const dual = getDualPrice(view, mode);
  const s = sizeMap[size];
  const onOffer = dual.original != null;
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline gap-1.5">
        {onOffer && (
          <span className={cn("text-text-tertiary line-through", s.secondary)}>
            {formatMoney(dual.original!)}
          </span>
        )}
        <span
          className={cn(
            "font-extrabold leading-none tracking-tight tabular",
            onOffer ? "text-danger-text" : "text-text",
            s.primary,
          )}
        >
          {formatMoney(dual.primary)}
        </span>
        <span className={cn("font-medium text-text-tertiary", s.secondary)}>{dual.primaryLabel}</span>
      </div>
      <span className={cn("mt-0.5 text-text-tertiary", s.secondary)}>
        {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {vat}%
      </span>
    </div>
  );
}
