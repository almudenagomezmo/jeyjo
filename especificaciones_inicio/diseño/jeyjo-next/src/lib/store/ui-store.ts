"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PriceMode } from "@/lib/types";

interface UiState {
  priceMode: PriceMode;
  setPriceMode: (mode: PriceMode) => void;
  togglePriceMode: () => void;

  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;

  megaMenuOpen: boolean;
  setMegaMenuOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      priceMode: "b2c",
      setPriceMode: (priceMode) => set({ priceMode }),
      togglePriceMode: () => set((s) => ({ priceMode: s.priceMode === "b2c" ? "b2b" : "b2c" })),

      miniCartOpen: false,
      setMiniCartOpen: (miniCartOpen) => set({ miniCartOpen }),

      megaMenuOpen: false,
      setMegaMenuOpen: (megaMenuOpen) => set({ megaMenuOpen }),
    }),
    { name: "jeyjo-ui", partialize: (s) => ({ priceMode: s.priceMode }) },
  ),
);
