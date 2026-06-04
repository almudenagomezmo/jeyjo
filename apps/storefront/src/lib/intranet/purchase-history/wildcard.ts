const WILDCARD_SKUS = new Set(['9000000001'])

export function isWildcardPurchaseSku(sku: string): boolean {
  return WILDCARD_SKUS.has(sku.trim())
}

export function filterNonWildcardLines<T extends { sku: string }>(lines: T[]): T[] {
  return lines.filter((line) => !isWildcardPurchaseSku(line.sku))
}
