"use client";

import { useCallback } from "react";

import { addWishlistSku, removeWishlistSku } from "@/lib/wishlist/api-client";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export function useWishlistToggle(productTitle?: string) {
  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.has);

  const toggleWithSync = useCallback(
    (sku: string) => {
      const wasWishlisted = has(sku);
      toggle(sku);
      void (async () => {
        if (wasWishlisted) {
          await removeWishlistSku(sku);
        } else {
          await addWishlistSku(sku, productTitle);
        }
      })();
      return !wasWishlisted;
    },
    [toggle, has, productTitle],
  );

  return { toggleWithSync, has };
}
