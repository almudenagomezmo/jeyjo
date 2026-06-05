import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/analytics/ga4", () => ({
  trackAddToCart: vi.fn(),
  trackAddToCartBatch: vi.fn(),
}));

import { trackAddToCart } from "@/lib/analytics/ga4";
import { useCartStore } from "@/lib/store/cart-store";

describe("cart store GA4", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fires add_to_cart when adding item with analytics", () => {
    useCartStore.getState().addItem("slug-1", 2, {
      item_id: "REF-001",
      item_name: "Producto",
      price: 3.5,
    });

    expect(trackAddToCart).toHaveBeenCalledWith({
      item_id: "REF-001",
      item_name: "Producto",
      price: 3.5,
      quantity: 2,
    });
  });
});
