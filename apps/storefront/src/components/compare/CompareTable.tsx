"use client";

import Image from "next/image";
import Link from "next/link";

import { StockIndicatorBadge } from "@/components/ui/StockBadge";
import { PlusIcon } from "@/components/ui/icons";
import { COMPARE_EMPTY_PLACEHOLDER } from "@/lib/compare/constants";
import { formatPackUnitLabel } from "@/lib/compare/map-compare-column";
import type { CompareColumn } from "@/lib/compare/types";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import { formatMoney } from "@/lib/utils/format";
import {
  getDualPrice,
  getPriceViewFromQuote,
} from "@/lib/utils/price";
import { cn } from "@/lib/utils/cn";

type CompareRow = {
  key: string;
  label: string;
  render: (column: CompareColumn) => React.ReactNode;
};

function ComparePriceCell({ column }: { column: CompareColumn }) {
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const mode = hydrated ? priceMode : "b2c";

  if (!column.quote) {
    return <span>{COMPARE_EMPTY_PLACEHOLDER}</span>;
  }

  const dual = getDualPrice(getPriceViewFromQuote(column.quote), mode);
  const onOffer = dual.original != null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        {onOffer ? (
          <span className="text-sm text-text-tertiary line-through tabular">
            {formatMoney(dual.original!)}
          </span>
        ) : null}
        <span
          className={cn(
            "text-lg font-extrabold tabular",
            onOffer ? "text-danger-text" : "text-text",
          )}
        >
          {formatMoney(dual.primary)}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-text-tertiary tabular">
        {formatMoney(dual.secondary)} {dual.secondaryLabel} · IVA {column.vatRate}%
      </p>
    </div>
  );
}

function CompareAddButton({ column }: { column: CompareColumn }) {
  const addItem = useCartStore((s) => s.addItem);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);

  const canAdd =
    column.stock.level === "available" ||
    column.stock.level === "low" ||
    column.stock.allowOrderWithoutStock;

  return (
    <button
      type="button"
      disabled={!canAdd}
      onClick={() => {
        addItem(column.sku, column.packUnit);
        setMiniCartOpen(true);
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-tertiary"
      aria-label={`Añadir ${column.title} al carrito`}
    >
      <PlusIcon size={14} strokeWidth={2.5} />
      Añadir
    </button>
  );
}

const COMPARE_ROWS: CompareRow[] = [
  {
    key: "price",
    label: "Precio",
    render: (column) => <ComparePriceCell column={column} />,
  },
  { key: "brand", label: "Marca", render: (c) => c.brand },
  { key: "supplier", label: "Proveedor", render: (c) => c.supplier },
  { key: "color", label: "Color", render: (c) => c.color },
  { key: "material", label: "Material", render: (c) => c.material },
  {
    key: "packUnit",
    label: "Unidad de envase",
    render: (c) =>
      c.packUnit > 1 ? formatPackUnitLabel(c.packUnit) : COMPARE_EMPTY_PLACEHOLDER,
  },
  {
    key: "stock",
    label: "Disponibilidad",
    render: (c) => (
      <StockIndicatorBadge indicator={c.stock} packSize={c.packUnit} />
    ),
  },
  { key: "description", label: "Descripción", render: (c) => c.description },
];

export function CompareTable({ columns }: { columns: CompareColumn[] }) {
  return (
    <div className="overflow-x-auto pb-24">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[120px] bg-surface px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary"
            >
              Atributo
            </th>
            {columns.map((column) => (
              <th
                key={column.sku}
                scope="col"
                className="min-w-[180px] border-l border-border px-4 py-4 align-top"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md bg-surface-muted">
                    {column.imageUrl ? (
                      <Image
                        src={column.imageUrl}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs text-text-tertiary">
                        Sin imagen
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/p/${column.slug}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
                  >
                    {column.title}
                  </Link>
                  <p className="font-mono text-[11px] text-text-tertiary">{column.sku}</p>
                  <CompareAddButton column={column} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.key} className="border-t border-border">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-surface px-3 py-3 text-left font-semibold text-text-secondary"
              >
                {row.label}
              </th>
              {columns.map((column) => (
                <td
                  key={`${row.key}-${column.sku}`}
                  className="border-l border-border px-4 py-3 align-top text-text"
                >
                  {row.render(column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
