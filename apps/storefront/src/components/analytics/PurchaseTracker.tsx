"use client";

import { useEffect, useRef } from "react";

import type { OrderPurchaseSnapshot } from "@/lib/analytics/ga4-purchase";
import { trackPurchase } from "@/lib/analytics/ga4";

type PurchaseTrackerProps = {
  snapshot: OrderPurchaseSnapshot | null;
  paid: boolean;
};

export function PurchaseTracker({ snapshot, paid }: PurchaseTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!paid || !snapshot || tracked.current) return;
    tracked.current = true;

    trackPurchase({
      transactionId: snapshot.orderNumber,
      value: snapshot.total,
      tax: snapshot.tax,
      shipping: snapshot.shipping,
      items: snapshot.items,
    });

    void fetch("/api/analytics/ga4-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    }).catch(() => undefined);
  }, [paid, snapshot]);

  return null;
}
