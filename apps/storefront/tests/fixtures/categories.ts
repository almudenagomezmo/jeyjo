import type { GlyphKind } from "@/lib/types";

export interface Subcategory {
  id: string;
  name: string;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  glyph: GlyphKind;
  subcategories: Subcategory[];
}

/** Demo taxonomy fixture for tests only — not used at runtime. */
export const CATEGORIES: readonly Category[] = [
  {
    id: "escritura",
    name: "Escritura y corrección",
    glyph: "pen",
    subcategories: [
      { id: "boligrafos", name: "Bolígrafos", count: 142 },
      { id: "rotuladores", name: "Rotuladores y marcadores", count: 88 },
    ],
  },
  {
    id: "papel",
    name: "Papel y blocs",
    glyph: "paper",
    subcategories: [{ id: "folios", name: "Folios A4 y A3", count: 56 }],
  },
];
