"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { useCartStore } from "@/lib/store/cart-store";

export function CartRecoverHandler() {
  const searchParams = useSearchParams();
  const mergeRecoveredLines = useCartStore((s) => s.mergeRecoveredLines);
  const handled = useRef(false);

  useEffect(() => {
    const recover = searchParams.get("recover");
    if (!recover || handled.current) return;
    handled.current = true;

    void (async () => {
      const res = await fetch(`/api/cart/recover?token=${encodeURIComponent(recover)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        lines?: { productId: string; qty: number }[];
      };
      if (data.lines?.length) {
        mergeRecoveredLines(data.lines);
      }
    })();
  }, [searchParams, mergeRecoveredLines]);

  return null;
}
