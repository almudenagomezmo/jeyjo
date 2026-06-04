import type { Category } from "@/lib/types";

/**
 * Catalogue taxonomy. `count` figures are illustrative facet counts
 * (what a real PIM would expose), independent of the demo product set.
 */
export const CATEGORIES: readonly Category[] = [
  {
    id: "escritura",
    name: "Escritura y corrección",
    glyph: "pen",
    subcategories: [
      { id: "boligrafos", name: "Bolígrafos", count: 142 },
      { id: "rotuladores", name: "Rotuladores y marcadores", count: 88 },
      { id: "lapices", name: "Lápices y portaminas", count: 64 },
      { id: "correccion", name: "Corrección", count: 32 },
    ],
  },
  {
    id: "papel",
    name: "Papel y blocs",
    glyph: "paper",
    subcategories: [
      { id: "folios", name: "Folios A4 y A3", count: 56 },
      { id: "cuadernos", name: "Cuadernos y blocs", count: 124 },
      { id: "manualidades", name: "Manualidades y escolar", count: 45 },
      { id: "sobres", name: "Sobres y mensajería", count: 38 },
    ],
  },
  {
    id: "impresion",
    name: "Impresión y tinta",
    glyph: "toner",
    subcategories: [
      { id: "toner", name: "Tóner láser", count: 312 },
      { id: "tinta", name: "Cartuchos de tinta", count: 287 },
      { id: "impresoras", name: "Impresoras y multifunción", count: 28 },
      { id: "etiquetas", name: "Etiquetas adhesivas", count: 76 },
    ],
  },
  {
    id: "archivo",
    name: "Archivo y carpetería",
    glyph: "folder",
    subcategories: [
      { id: "archivadores", name: "Archivadores AZ", count: 48 },
      { id: "carpetas", name: "Carpetas y fundas", count: 92 },
      { id: "separadores", name: "Subcarpetas y separadores", count: 38 },
      { id: "cajas", name: "Cajas archivo", count: 24 },
    ],
  },
  {
    id: "oficina",
    name: "Material de oficina",
    glyph: "stapler",
    subcategories: [
      { id: "grapado", name: "Grapadoras y grapas", count: 42 },
      { id: "corte", name: "Tijeras y cúter", count: 28 },
      { id: "calculadoras", name: "Calculadoras", count: 36 },
      { id: "adhesivos", name: "Cintas adhesivas", count: 54 },
    ],
  },
  {
    id: "reciclaje",
    name: "Reciclaje y limpieza",
    glyph: "recycle",
    subcategories: [
      { id: "papeleras", name: "Papeleras de reciclaje", count: 32 },
      { id: "pilas", name: "Pilas y baterías", count: 28 },
      { id: "contenedores", name: "Contenedores", count: 18 },
      { id: "limpieza", name: "Limpieza oficina", count: 64 },
    ],
  },
];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
