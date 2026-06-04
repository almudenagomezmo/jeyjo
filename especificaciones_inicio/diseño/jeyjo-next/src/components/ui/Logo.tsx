interface LogoProps {
  size?: number;
  variant?: "full" | "mark";
  /** Color for the wordmark/dot ink. Defaults to currentColor. */
  color?: string;
  className?: string;
}

const GREEN = "#22CE7A";

export function Logo({ size = 26, variant = "full", color = "currentColor", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" className={className} role="img" aria-label="Jeyjo">
        <circle cx="20" cy="20" r="14" fill={GREEN} />
        <circle cx="20" cy="20" r="5.5" fill={color} />
        <circle cx="11" cy="6" r="2" fill={GREEN} />
        <circle cx="17" cy="3.5" r="2.4" fill={GREEN} />
        <circle cx="22" cy="7" r="1.6" fill={GREEN} />
      </svg>
    );
  }
  return (
    <svg
      width={size * (120 / 40)}
      height={size}
      viewBox="0 0 120 40"
      className={className}
      role="img"
      aria-label="Jeyjo"
    >
      <text
        x="0"
        y="32"
        fontFamily="Manrope, sans-serif"
        fontWeight="800"
        fontSize="34"
        letterSpacing="-1.5"
        fill={color}
      >
        jeyj
      </text>
      <circle cx="93" cy="22" r="14" fill={GREEN} />
      <circle cx="93" cy="22" r="5" fill={color} />
      <circle cx="38" cy="6" r="1.7" fill={GREEN} />
      <circle cx="44" cy="3" r="2.4" fill={GREEN} />
      <circle cx="84" cy="3" r="2.6" fill={GREEN} />
      <circle cx="92" cy="6" r="1.8" fill={GREEN} />
    </svg>
  );
}
