import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function createIcon(node: React.ReactNode, displayName: string) {
  const Icon = ({ size = 18, strokeWidth = 1.7, ...props }: IconProps & { strokeWidth?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {node}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </>,
  "SearchIcon",
);
export const CartIcon = createIcon(
  <>
    <path d="M3 4h2l2.4 11.2A2 2 0 0 0 9.36 17h8.28a2 2 0 0 0 1.96-1.6L21 8H6" />
    <circle cx="10" cy="20" r="1.5" />
    <circle cx="17" cy="20" r="1.5" />
  </>,
  "CartIcon",
);
export const UserIcon = createIcon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
  "UserIcon",
);
export const HeartIcon = createIcon(
  <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" />,
  "HeartIcon",
);
export const MenuIcon = createIcon(
  <>
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </>,
  "MenuIcon",
);
export const CloseIcon = createIcon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>,
  "CloseIcon",
);
export const ChevronDownIcon = createIcon(<path d="m6 9 6 6 6-6" />, "ChevronDownIcon");
export const ChevronRightIcon = createIcon(<path d="m9 6 6 6-6 6" />, "ChevronRightIcon");
export const ChevronLeftIcon = createIcon(<path d="m15 6-6 6 6 6" />, "ChevronLeftIcon");
export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
  "PlusIcon",
);
export const MinusIcon = createIcon(<path d="M5 12h14" />, "MinusIcon");
export const CheckIcon = createIcon(<path d="M5 12l5 5L20 6" />, "CheckIcon");
export const StarIcon = createIcon(
  <path d="M12 3l2.92 6.02L21.5 10l-4.8 4.7 1.13 6.65L12 18.2 6.17 21.35 7.3 14.7 2.5 10l6.58-.98L12 3Z" />,
  "StarIcon",
);
export const FilterIcon = createIcon(
  <>
    <path d="M3 5h18" />
    <path d="M6 12h12" />
    <path d="M10 19h4" />
  </>,
  "FilterIcon",
);
export const TruckIcon = createIcon(
  <>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>,
  "TruckIcon",
);
export const ShieldIcon = createIcon(
  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />,
  "ShieldIcon",
);
export const SparklesIcon = createIcon(
  <>
    <path d="M12 3v4" />
    <path d="M12 17v4" />
    <path d="M3 12h4" />
    <path d="M17 12h4" />
    <path d="m6 6 2 2" />
    <path d="m16 16 2 2" />
    <path d="m18 6-2 2" />
    <path d="m8 16-2 2" />
  </>,
  "SparklesIcon",
);
export const LeafIcon = createIcon(
  <>
    <path d="M11 20A8 8 0 0 1 3 12V4h8a8 8 0 0 1 8 8" />
    <path d="M3 4c4 0 8 4 8 16" />
  </>,
  "LeafIcon",
);
export const BoxIcon = createIcon(
  <>
    <path d="M3 7 12 3l9 4" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="m3 7 9 4 9-4" />
    <path d="M12 11v10" />
  </>,
  "BoxIcon",
);
export const SunIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
  </>,
  "SunIcon",
);
export const MoonIcon = createIcon(
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />,
  "MoonIcon",
);
export const RefreshIcon = createIcon(
  <>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </>,
  "RefreshIcon",
);
export const TrashIcon = createIcon(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="m6 6 1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </>,
  "TrashIcon",
);
