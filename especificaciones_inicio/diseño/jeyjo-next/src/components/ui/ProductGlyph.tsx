import type { GlyphKind } from "@/lib/types";

interface ProductGlyphProps {
  kind: GlyphKind;
  size?: number;
  primary?: string;
  secondary?: string;
}

/**
 * Schematic, brand-neutral product silhouettes.
 * These are placeholders standing in for real product photography — replace
 * <ProductImage> with a next/image once a DAM/CDN is wired up.
 */
export function ProductGlyph({
  kind,
  size = 80,
  primary = "#1F8A5B",
  secondary = "#0E4F32",
}: ProductGlyphProps) {
  const common = { width: size, height: size, viewBox: "0 0 100 100", "aria-hidden": true } as const;
  switch (kind) {
    case "pen":
      return (
        <svg {...common}>
          <rect x="42" y="15" width="16" height="70" rx="3" fill={primary} />
          <polygon points="42,85 50,95 58,85" fill={secondary} />
          <rect x="42" y="25" width="16" height="6" fill="rgba(0,0,0,0.18)" />
        </svg>
      );
    case "notebook":
      return (
        <svg {...common}>
          <rect x="20" y="15" width="60" height="70" rx="3" fill={primary} />
          <rect x="20" y="15" width="8" height="70" fill={secondary} />
          <line x1="35" y1="35" x2="70" y2="35" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
          <line x1="35" y1="45" x2="70" y2="45" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
          <line x1="35" y1="55" x2="65" y2="55" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
        </svg>
      );
    case "paper":
      return (
        <svg {...common}>
          <rect x="22" y="12" width="56" height="76" rx="2" fill="#fff" stroke={primary} strokeWidth="2" />
          <rect x="22" y="12" width="56" height="14" fill={primary} />
          <line x1="30" y1="38" x2="70" y2="38" stroke={primary} strokeWidth="2" />
          <line x1="30" y1="48" x2="70" y2="48" stroke={primary} strokeWidth="2" />
          <line x1="30" y1="58" x2="64" y2="58" stroke={primary} strokeWidth="2" />
        </svg>
      );
    case "toner":
      return (
        <svg {...common}>
          <rect x="15" y="35" width="70" height="40" rx="3" fill={primary} />
          <rect x="30" y="25" width="40" height="14" rx="2" fill={secondary} />
          <rect x="20" y="50" width="50" height="8" fill="rgba(0,0,0,0.25)" />
        </svg>
      );
    case "ink":
      return (
        <svg {...common}>
          <rect x="25" y="20" width="50" height="60" rx="4" fill={primary} />
          <rect x="35" y="14" width="30" height="10" fill={secondary} />
          <circle cx="50" cy="50" r="8" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M15 28 H40 L48 22 H85 V80 H15 Z" fill={primary} />
          <rect x="15" y="40" width="70" height="6" fill={secondary} />
        </svg>
      );
    case "binder":
      return (
        <svg {...common}>
          <rect x="20" y="14" width="55" height="74" rx="2" fill={primary} />
          <rect x="75" y="14" width="10" height="74" fill={secondary} />
          <rect x="30" y="30" width="30" height="3" fill="rgba(255,255,255,0.7)" />
          <rect x="30" y="40" width="30" height="3" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case "stapler":
      return (
        <svg {...common}>
          <rect x="15" y="55" width="70" height="14" rx="3" fill={secondary} />
          <rect x="20" y="40" width="60" height="16" rx="6" fill={primary} />
          <rect x="30" y="46" width="40" height="4" fill="rgba(0,0,0,0.2)" />
        </svg>
      );
    case "calc":
      return (
        <svg {...common}>
          <rect x="22" y="14" width="56" height="72" rx="4" fill={primary} />
          <rect x="28" y="20" width="44" height="14" fill={secondary} />
          <g fill="rgba(255,255,255,0.85)">
            <rect x="30" y="42" width="8" height="8" />
            <rect x="42" y="42" width="8" height="8" />
            <rect x="54" y="42" width="8" height="8" />
            <rect x="66" y="42" width="6" height="8" />
            <rect x="30" y="54" width="8" height="8" />
            <rect x="42" y="54" width="8" height="8" />
            <rect x="54" y="54" width="8" height="8" />
            <rect x="66" y="54" width="6" height="8" />
            <rect x="30" y="66" width="20" height="8" />
          </g>
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="10" stroke={primary} strokeWidth="4" fill="none" />
          <circle cx="32" cy="68" r="10" stroke={primary} strokeWidth="4" fill="none" />
          <path d="M42 32 L78 70 M42 68 L78 30" stroke={secondary} strokeWidth="3" />
        </svg>
      );
    case "marker":
      return (
        <svg {...common}>
          <rect x="35" y="20" width="30" height="55" rx="4" fill={primary} />
          <rect x="35" y="20" width="30" height="14" rx="4" fill={secondary} />
          <polygon points="35,75 50,90 65,75" fill="#fff" stroke={secondary} strokeWidth="2" />
        </svg>
      );
    case "tape":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="32" fill={primary} />
          <circle cx="50" cy="50" r="14" fill="var(--surface-subtle)" />
          <path d="M50 18 v32" stroke={secondary} strokeWidth="3" />
        </svg>
      );
    case "recycle":
      return (
        <svg {...common}>
          <path d="M50 18 L66 44 L34 44 Z" fill={primary} />
          <path d="M84 70 L60 86 L52 60 Z" fill={primary} />
          <path d="M16 70 L26 44 L48 60 Z" fill={primary} />
        </svg>
      );
    case "bin":
      return (
        <svg {...common}>
          <rect x="22" y="25" width="56" height="60" rx="3" fill={primary} />
          <rect x="18" y="18" width="64" height="10" rx="2" fill={secondary} />
          <line x1="38" y1="35" x2="38" y2="78" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <line x1="50" y1="35" x2="50" y2="78" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <line x1="62" y1="35" x2="62" y2="78" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect x="25" y="20" width="50" height="62" rx="3" fill={primary} />
          <rect x="38" y="14" width="24" height="8" rx="1" fill={secondary} />
          <path d="M48 38 L42 58 L52 58 L46 78" stroke="#fff" strokeWidth="3" fill="none" />
        </svg>
      );
    case "printer":
      return (
        <svg {...common}>
          <rect x="15" y="35" width="70" height="35" rx="3" fill={primary} />
          <rect x="25" y="22" width="50" height="18" fill={secondary} />
          <rect x="25" y="60" width="50" height="22" fill="#fff" stroke={secondary} strokeWidth="2" />
          <circle cx="72" cy="48" r="3" fill="rgba(255,255,255,0.8)" />
        </svg>
      );
    case "box":
    default:
      return (
        <svg {...common}>
          <path d="M15 30 L50 14 L85 30 L50 46 Z" fill={primary} />
          <path d="M15 30 V70 L50 86 V46 Z" fill={secondary} />
          <path d="M85 30 V70 L50 86 V46 Z" fill={primary} opacity="0.8" />
        </svg>
      );
  }
}
