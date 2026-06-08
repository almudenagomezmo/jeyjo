"use client";

import { GridIcon, ListIcon } from "@/components/ui/icons";
import type { PlpViewMode } from "@/lib/plp/view-mode";
import { cn } from "@/lib/utils/cn";

interface PlpViewToggleProps {
  value: PlpViewMode;
  onChange: (mode: PlpViewMode) => void;
}

const OPTIONS: Array<{ mode: PlpViewMode; label: string; Icon: typeof GridIcon }> = [
  { mode: "grid", label: "Cuadrícula", Icon: GridIcon },
  { mode: "list", label: "Lista", Icon: ListIcon },
];

export function PlpViewToggle({ value, onChange }: PlpViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Formato de listado"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-[5px] transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
