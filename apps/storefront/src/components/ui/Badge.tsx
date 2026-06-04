import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info" | "dark";
type BadgeSize = "xs" | "sm" | "md";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  primary: "bg-primary-soft text-text-brand",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info-text",
  dark: "bg-ink text-white",
};

const badgeSizes: Record<BadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  size?: BadgeSize;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, tone = "neutral", size = "sm", icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold leading-tight",
        tones[tone],
        badgeSizes[size],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
