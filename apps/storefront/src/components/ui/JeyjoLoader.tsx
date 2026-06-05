import { cn } from "@/lib/utils/cn";

const GREEN = "#22CE7A";

type JeyjoLoaderSize = "sm" | "md" | "lg";

const sizeMap: Record<JeyjoLoaderSize, number> = {
  sm: 28,
  md: 40,
  lg: 56,
};

interface JeyjoLoaderProps {
  size?: JeyjoLoaderSize;
  label?: string;
  className?: string;
  /** Hide the text label visually but keep it for screen readers. */
  labelSrOnly?: boolean;
}

export function JeyjoLoader({
  size = "md",
  label = "Cargando",
  className,
  labelSrOnly = false,
}: JeyjoLoaderProps) {
  const markSize = sizeMap[size];

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <JeyjoLoaderMark size={markSize} />
      <p
        className={cn(
          "text-sm font-medium text-text-secondary",
          labelSrOnly && "sr-only",
        )}
      >
        {label}
      </p>
    </div>
  );
}

function JeyjoLoaderMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="jeyjo-loader-mark"
      aria-hidden
    >
      <circle className="jeyjo-loader-ring" cx="20" cy="20" r="14" fill={GREEN} />
      <circle className="jeyjo-loader-core" cx="20" cy="20" r="5.5" fill="currentColor" />
      <circle className="jeyjo-loader-dot jeyjo-loader-dot--1" cx="11" cy="6" r="2" fill={GREEN} />
      <circle className="jeyjo-loader-dot jeyjo-loader-dot--2" cx="17" cy="3.5" r="2.4" fill={GREEN} />
      <circle className="jeyjo-loader-dot jeyjo-loader-dot--3" cx="22" cy="7" r="1.6" fill={GREEN} />
    </svg>
  );
}

interface PageLoadingProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export function PageLoading({
  label = "Cargando",
  className,
  compact = false,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        compact ? "py-16" : "min-h-[40vh] py-24",
        className,
      )}
    >
      <JeyjoLoader size="lg" label={label} />
    </div>
  );
}

interface LoadingOverlayProps {
  label?: string;
  className?: string;
}

export function LoadingOverlay({ label = "Cargando", className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-surface/75 backdrop-blur-[2px]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <JeyjoLoader size="md" label={label} />
    </div>
  );
}
