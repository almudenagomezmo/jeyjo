import Link from "next/link";
import { LogoutButton } from "@/components/account/LogoutButton";
import { NotificationBell } from "@/components/intranet/NotificationBell";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/ui/Logo";

type PortalTopBarProps = {
  commercialName: string;
  profileId: string;
};

export function PortalTopBar({ commercialName, profileId }: PortalTopBarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface">
      <Container className="flex h-14 items-center gap-3 sm:gap-4">
        <Link href="/" aria-label="Inicio Jeyjo" className="shrink-0">
          <Logo size={24} color="var(--text)" />
        </Link>

        <Link
          href="/"
          className="hidden rounded-md px-2 py-1.5 text-sm font-semibold text-text-secondary hover:bg-surface-muted sm:inline-flex"
        >
          Tienda
        </Link>

        <span className="hidden rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-secondary md:inline-flex">
          Precios sin IVA
        </span>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <NotificationBell profileId={profileId} />
          <span
            className="hidden truncate text-sm font-semibold text-text-primary sm:inline"
            title={commercialName}
          >
            {commercialName}
          </span>
          <LogoutButton />
        </div>
      </Container>
    </header>
  );
}
