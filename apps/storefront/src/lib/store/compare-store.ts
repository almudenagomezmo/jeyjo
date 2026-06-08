'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  COMPARE_LIMIT_MESSAGE,
  COMPARE_MAX_ITEMS,
} from '@/lib/compare/constants'

export type CompareItem = {
  sku: string
  slug: string
  title: string
  imageUrl: string | null
}

type ToggleResult = { added: boolean; rejected: boolean }

interface CompareState {
  items: CompareItem[]
  limitMessage: string | null
  toggle: (item: CompareItem) => ToggleResult
  remove: (sku: string) => void
  clear: () => void
  isSelected: (sku: string) => boolean
  setItems: (items: CompareItem[]) => void
  clearLimitMessage: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      limitMessage: null,

      toggle: (item) => {
        const sku = item.sku.trim()
        const existing = get().items
        if (existing.some((i) => i.sku === sku)) {
          set({
            items: existing.filter((i) => i.sku !== sku),
            limitMessage: null,
          })
          return { added: false, rejected: false }
        }

        if (existing.length >= COMPARE_MAX_ITEMS) {
          set({ limitMessage: COMPARE_LIMIT_MESSAGE })
          return { added: false, rejected: true }
        }

        set({
          items: [...existing, item],
          limitMessage: null,
        })
        return { added: true, rejected: false }
      },

      remove: (sku) =>
        set((s) => ({
          items: s.items.filter((i) => i.sku !== sku),
          limitMessage: null,
        })),

      clear: () => set({ items: [], limitMessage: null }),

      isSelected: (sku) => get().items.some((i) => i.sku === sku.trim()),

      setItems: (items) =>
        set({
          items: items.slice(0, COMPARE_MAX_ITEMS),
          limitMessage: null,
        }),

      clearLimitMessage: () => set({ limitMessage: null }),
    }),
    { name: 'jeyjo-compare' },
  ),
)
