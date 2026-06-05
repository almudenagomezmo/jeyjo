"use client";

import { WishlistLoginRequiredDialog } from "@/components/wishlist/WishlistLoginRequiredDialog";
import { WishlistSyncBootstrap } from "@/components/wishlist/WishlistSyncBootstrap";
import { WishlistSessionProvider } from "@/lib/wishlist/session-context";

export function WishlistRoot({
  hasSession,
  children,
}: {
  hasSession: boolean;
  children: React.ReactNode;
}) {
  return (
    <WishlistSessionProvider hasSession={hasSession}>
      <WishlistSyncBootstrap />
      <WishlistLoginRequiredDialog />
      {children}
    </WishlistSessionProvider>
  );
}
