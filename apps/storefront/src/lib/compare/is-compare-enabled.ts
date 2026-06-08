/** Feature flag — default enabled when unset. */
export function isCompareEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COMPARE_ENABLED !== 'false'
}
