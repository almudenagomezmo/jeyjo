"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function QtyStepper({ value, onChange, step = 1, min = step, max = 9999 }: QtyStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        aria-label="Restar"
        className="grid h-9 w-9 place-items-center text-text-secondary hover:bg-surface-hover"
        onClick={() => onChange(clamp(value - step))}
      >
        <MinusIcon size={14} />
      </button>
      <input
        aria-label="Cantidad"
        className="h-9 w-12 border-0 bg-transparent text-center text-sm font-semibold tabular outline-none"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
      />
      <button
        type="button"
        aria-label="Sumar"
        className="grid h-9 w-9 place-items-center text-text-secondary hover:bg-surface-hover"
        onClick={() => onChange(clamp(value + step))}
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}
