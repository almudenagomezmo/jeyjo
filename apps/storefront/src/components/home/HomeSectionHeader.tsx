import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

export function HomeSectionHeader({
  title,
  subtitle,
  href,
  cta,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h2>
        {subtitle && <p className="mt-1 text-text-tertiary">{subtitle}</p>}
      </div>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-text-brand"
        >
          {cta} <ChevronRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}
