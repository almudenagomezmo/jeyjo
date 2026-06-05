import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ga4Enabled,
  trackAddToCart,
  trackBeginCheckout,
  trackPageView,
  trackPurchase,
  trackViewItem,
} from "@/lib/analytics/ga4";

describe("ga4 helpers", () => {
  const gtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { gtag });
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_GA4_ENABLED = "true";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    delete process.env.NEXT_PUBLIC_GA4_ENABLED;
  });

  it("no-ops when GA4 disabled", () => {
    process.env.NEXT_PUBLIC_GA4_ENABLED = "false";
    expect(ga4Enabled()).toBe(false);
    trackPageView("/");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("tracks page_view", () => {
    trackPageView("/categoria/escritura");
    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/categoria/escritura",
    });
  });

  it("tracks view_item with EUR payload", () => {
    trackViewItem({ item_id: "REF-001", item_name: "Bolígrafo", price: 2.5 });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "view_item",
      expect.objectContaining({
        currency: "EUR",
        items: [{ item_id: "REF-001", item_name: "Bolígrafo", price: 2.5, quantity: 1 }],
      }),
    );
  });

  it("tracks add_to_cart quantity", () => {
    trackAddToCart({
      item_id: "REF-001",
      item_name: "Bolígrafo",
      price: 2,
      quantity: 3,
    });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "add_to_cart",
      expect.objectContaining({ value: 6 }),
    );
  });

  it("tracks begin_checkout", () => {
    trackBeginCheckout([{ item_id: "REF-001", price: 2, quantity: 1 }], 2);
    expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", expect.any(Object));
  });

  it("tracks purchase with transaction_id", () => {
    trackPurchase({
      transactionId: "JW-TEST",
      value: 10,
      items: [{ item_id: "REF-001", price: 10, quantity: 1 }],
    });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "purchase",
      expect.objectContaining({ transaction_id: "JW-TEST", value: 10 }),
    );
  });
});
