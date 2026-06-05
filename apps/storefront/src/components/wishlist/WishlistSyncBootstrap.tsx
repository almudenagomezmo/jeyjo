"use client";

import { useWishlistSync } from "@/lib/hooks/useWishlistSync";

export function WishlistSyncBootstrap() {
  useWishlistSync();
  return null;
}
