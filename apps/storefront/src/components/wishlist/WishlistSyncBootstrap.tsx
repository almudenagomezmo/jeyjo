"use client";

import { useWishlistSync } from "@/lib/hooks/useWishlistSync";
import { useWishlistSession } from "@/lib/wishlist/session-context";

export function WishlistSyncBootstrap() {
  const { hasSession } = useWishlistSession();
  useWishlistSync(hasSession);
  return null;
}
