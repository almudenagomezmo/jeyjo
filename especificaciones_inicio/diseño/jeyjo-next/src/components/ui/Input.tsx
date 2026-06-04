"use client";

import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { iconStart, iconEnd, invalid, className, ...props },
  ref,
) {
  const field = (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border bg-surface px-3 text-sm text-text outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus:ring-2 focus:ring-primary/30",
        invalid ? "border-danger" : "border-border focus:border-primary",
        iconStart && "pl-[38px]",
        iconEnd && "pr-[38px]",
        className,
      )}
      {...props}
    />
  );

  if (!iconStart && !iconEnd) return field;

  return (
    <div className="relative">
      {iconStart && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
          {iconStart}
        </span>
      )}
      {field}
      {iconEnd && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
          {iconEnd}
        </span>
      )}
    </div>
  );
});
