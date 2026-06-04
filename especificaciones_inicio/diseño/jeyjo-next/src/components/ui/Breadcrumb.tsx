import Link from "next/link";
import { Fragment } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1 text-[13px] text-text-tertiary">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRightIcon size={12} />}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-text">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "font-semibold text-text" : undefined}>{item.label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
