"use client";

import { useEffect, useRef } from "react";

import { useCartStore } from "@/lib/store/cart-store";

const INTERVAL_MS = 45_000;

function beaconsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED !== "false";
}

export function AnalyticsBeacon() {
  const lines = useCartStore((s) => s.lines);
  const linesRef = useRef(lines);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    if (!beaconsEnabled()) return;

    const send = () => {
      if (document.visibilityState !== "visible") return;
      const cartLines = linesRef.current;
      const lineCount = cartLines.length;
      const totalQty = cartLines.reduce((sum, l) => sum + l.qty, 0);
      void fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lineCount, totalQty }),
      }).catch(() => undefined);
    };

    send();
    const timer = window.setInterval(send, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
