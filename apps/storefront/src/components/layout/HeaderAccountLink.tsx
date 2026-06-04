"use client";

import Link from "next/link";
import { UserIcon } from "@/components/ui/icons";

type HeaderAccountLinkProps = {
  href: string;
  label: string;
};

export function HeaderAccountLink({ href, label }: HeaderAccountLinkProps) {
  return (
    <Link
      href={href}
      className="hidden h-10 max-w-[200px] items-center gap-1.5 truncate rounded-md px-3 text-sm font-semibold hover:bg-surface-muted sm:inline-flex"
      title={label}
    >
      <UserIcon size={18} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
