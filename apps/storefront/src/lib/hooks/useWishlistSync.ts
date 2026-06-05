"use client";

import { useEffect, useRef } from "react";

import { fetchWishlistSkus, syncWishlistSkus } from "@/lib/wishlist/api-client";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export function useWishlistSync(enabled = true) {
  const mergedRef = useRef(false);
  const setIds = useWishlistStore((s) => s.setIds);
  const ids = useWishlistStore((s) => s.ids);

  useEffect(() => {
    if (!enabled || mergedRef.current) return;
    mergedRef.current = true;

    void (async () => {
      const serverSkus = await fetchWishlistSkus();
      if (serverSkus === null) return;

      const localSkus = useWishlistStore.getState().ids;
      const merged = [...new Set([...localSkus, ...serverSkus])];
      if (merged.length === 0) return;

      const result = await syncWishlistSkus(merged);
      if (result) setIds(result);
    })();
  }, [enabled, setIds]);

  return ids;
}
