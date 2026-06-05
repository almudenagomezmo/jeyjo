"use client";

import { useCallback } from "react";

import { addWishlistSku, removeWishlistSku } from "@/lib/wishlist/api-client";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { useWishlistSession } from "@/lib/wishlist/session-context";

/** Wishlist state for a single SKU — subscribes to store changes so the heart re-renders. */
export function useWishlistItem(sku: string, productTitle?: string) {
  const { hasSession, openLoginModal } = useWishlistSession();
  const wishlisted = useWishlistStore(
    (s) => hasSession && sku.length > 0 && s.ids.includes(sku),
  );
  const toggle = useWishlistStore((s) => s.toggle);

  const toggleWithSync = useCallback(() => {
    if (!sku) return false;

    if (!hasSession) {
      openLoginModal();
      return false;
    }

    const wasWishlisted = useWishlistStore.getState().ids.includes(sku);
    toggle(sku);

    void (async () => {
      const ok = wasWishlisted
        ? await removeWishlistSku(sku)
        : await addWishlistSku(sku, productTitle);
      if (!ok) toggle(sku);
    })();

    return !wasWishlisted;
  }, [sku, hasSession, openLoginModal, toggle, productTitle]);

  return { wishlisted, toggleWithSync, hasSession };
}
