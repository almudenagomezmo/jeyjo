export function roundUpToPack(qty: number, packUnit: number): number {
  if (packUnit <= 1) return Math.max(1, qty)
  return Math.ceil(qty / packUnit) * packUnit
}
