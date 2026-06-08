const SKU_SEP = ','

/** Parse `skus` from URL search params (CSV or repeated keys). Preserves order, dedupes. */
export function parseCompareSkusParam(
  value: string | string[] | undefined,
): string[] {
  if (value == null) return []

  const rawParts = Array.isArray(value)
    ? value.flatMap((v) => v.split(SKU_SEP))
    : value.split(SKU_SEP)

  const seen = new Set<string>()
  const out: string[] = []
  for (const part of rawParts) {
    const sku = part.trim()
    if (!sku || seen.has(sku)) continue
    seen.add(sku)
    out.push(sku)
  }
  return out.slice(0, 3)
}

export function buildCompareUrl(skus: readonly string[]): string {
  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))].slice(0, 3)
  if (unique.length === 0) return '/comparar'
  return `/comparar?skus=${encodeURIComponent(unique.join(SKU_SEP))}`
}
