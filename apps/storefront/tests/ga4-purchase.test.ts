import { describe, expect, it } from "vitest";

import { mapOrderLineSnapshots } from "@/lib/analytics/ga4-purchase";

describe("mapOrderLineSnapshots", () => {
  it("maps order lines to purchase snapshot", () => {
    const snapshot = mapOrderLineSnapshots(
      "JW-1001",
      121,
      5,
      [
        { skuErp: "REF-001", name: "Bolígrafo", qty: 2, unitPrice: 2.5, lineTotal: 5 },
        { skuErp: "REF-002", name: "Cuaderno", qty: 1, unitPrice: 100, lineTotal: 100 },
      ],
      true,
    );

    expect(snapshot).toMatchObject({
      orderNumber: "JW-1001",
      paid: true,
      total: 121,
      shipping: 5,
      items: [
        { item_id: "REF-001", item_name: "Bolígrafo", price: 2.5, quantity: 2 },
        { item_id: "REF-002", item_name: "Cuaderno", price: 100, quantity: 1 },
      ],
    });
  });
});
