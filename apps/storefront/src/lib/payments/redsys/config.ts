export type RedsysEnv = 'test' | 'prod'

export function getRedsysConfig() {
  const merchantCode = process.env.REDSYS_MERCHANT_CODE?.trim()
  const terminal = process.env.REDSYS_TERMINAL?.trim() ?? '001'
  const secretKey = process.env.REDSYS_SECRET_KEY?.trim()
  const env = (process.env.REDSYS_ENV?.trim() === 'prod' ? 'prod' : 'test') as RedsysEnv
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, '')

  const tpvUrl =
    env === 'prod'
      ? 'https://sis.redsys.es/sis/realizarPago'
      : 'https://sis-t.redsys.es:25443/sis/realizarPago'

  return {
    merchantCode,
    terminal,
    secretKey,
    env,
    storefrontUrl,
    tpvUrl,
    isConfigured: Boolean(merchantCode && secretKey && storefrontUrl),
  }
}

/** Redsys order ref: 4–12 alphanumeric, first 4 numeric. */
export function normalizeRedsysOrderRef(orderNumber: string): string {
  const alnum = orderNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const base = alnum.length >= 4 ? alnum.slice(0, 12) : `0000${alnum}`.slice(0, 12)
  const padded = base.padStart(4, '0').slice(0, 12)
  const firstFour = padded.slice(0, 4).replace(/\D/g, '0').padStart(4, '0')
  return `${firstFour}${padded.slice(4)}`.slice(0, 12)
}
