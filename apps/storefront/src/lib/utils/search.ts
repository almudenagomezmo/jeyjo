import { CATEGORIES } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";
import { isPlpDemoFallback } from "@/lib/plp/demo-fallback";
import type { Product } from "@/lib/types";

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const singular = (w: string): string => w.replace(/(es|s)$/i, "");

/**
 * Lightweight token-based product search, tolerant to plurals and accents.
 * In production this is where you'd call a real search backend (e.g. Qdrant /
 * Typesense); the UI only depends on this function's signature.
 */
export function searchProducts(query: string, limit = 100): Product[] {
  if (!isPlpDemoFallback()) return [];
  const tokens = normalize(query)
    .split(/\s+/)
    .map(singular)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  const scored = PRODUCTS.map((p) => {
    const haystack = normalize(
      [p.name, p.brand, p.ref, p.oem ?? "", p.ean, p.tags.join(" ")].join(" "),
    );
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    return { product: p, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((r) => r.product);
}

export interface CategorySuggestion {
  href: string;
  label: string;
}

export function searchCategories(query: string, limit = 4): CategorySuggestion[] {
  if (!isPlpDemoFallback()) return [];
  const q = normalize(query);
  if (q.length < 2) return [];
  const out: CategorySuggestion[] = [];
  for (const cat of CATEGORIES) {
    if (normalize(cat.name).includes(q)) {
      out.push({ href: `/c/${cat.id}`, label: cat.name });
    }
    for (const sub of cat.subcategories) {
      if (normalize(sub.name).includes(q)) {
        out.push({ href: `/c/${cat.id}/${sub.id}`, label: `${cat.name} · ${sub.name}` });
      }
    }
  }
  return out.slice(0, limit);
}
