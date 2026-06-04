import { Slot } from "@/components/ui/Slot";
import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark" | "soft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary border-primary hover:bg-primary-hover",
  secondary: "bg-surface text-text border-border hover:bg-surface-hover",
  ghost: "bg-transparent text-text border-transparent hover:bg-surface-muted",
  danger: "bg-danger text-white border-danger hover:brightness-105",
  dark: "bg-ink text-white border-ink hover:brightness-110",
  soft: "bg-primary-soft text-text-brand border-transparent hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border font-semibold leading-none transition-[background,color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  /**
   * Render as the single child element (e.g. a Next.js <Link>) instead of a
   * <button>. When using asChild, put any icons INSIDE the child element.
   */
  asChild?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block,
  asChild,
  iconStart,
  iconEnd,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], block && "w-full", className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button className={classes} {...props}>
      {iconStart}
      {children}
      {iconEnd}
    </button>
  );
}
