import type { Payload } from 'payload'

export async function assignNextQuoteNumber(payload: Payload): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `P-${year}-`

  const latest = await payload.find({
    collection: 'quotes',
    where: {
      quoteNumber: { contains: prefix },
    },
    sort: '-quoteNumber',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let seq = 1
  const lastNumber = latest.docs[0]?.quoteNumber
  if (lastNumber?.startsWith(prefix)) {
    const parsed = Number.parseInt(lastNumber.slice(prefix.length), 10)
    if (Number.isFinite(parsed)) seq = parsed + 1
  }

  return `${prefix}${String(seq).padStart(5, '0')}`
}
