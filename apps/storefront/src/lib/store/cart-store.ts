"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

export type CartBatchItem = { productId: string; qty?: number };

interface CartState {
  lines: CartLine[];
  addItem: (productId: string, qty?: number) => void;
  addItems: (items: CartBatchItem[]) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addItem: (productId, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId ? { ...l, qty: l.qty + qty } : l,
              ),
            };
          }
          return { lines: [...state.lines, { productId, qty }] };
        }),
      addItems: (items) =>
        set((state) => {
          let lines = [...state.lines];
          for (const { productId, qty = 1 } of items) {
            if (!productId || qty <= 0) continue;
            const existing = lines.find((l) => l.productId === productId);
            if (existing) {
              lines = lines.map((l) =>
                l.productId === productId ? { ...l, qty: l.qty + qty } : l,
              );
            } else {
              lines = [...lines, { productId, qty }];
            }
          }
          return { lines };
        }),
      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        })),
      removeItem: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "jeyjo-cart" },
  ),
);

/** Total item count (sum of quantities). Use with a selector to avoid re-renders. */
export const selectCartCount = (state: CartState): number =>
  state.lines.reduce((sum, l) => sum + l.qty, 0);
