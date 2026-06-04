export function isQuotesEnabled(): boolean {
  return (
    process.env.QUOTES_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_QUOTES_ENABLED === 'true'
  )
}

/** Client components — only NEXT_PUBLIC is available in the browser bundle. */
export function isQuotesEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_QUOTES_ENABLED === 'true'
}
