import type { Payload } from 'payload'

export async function assignNextRmaNumber(payload: Payload): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RMA-${year}-`

  const latest = await payload.find({
    collection: 'rma-incidents',
    where: {
      rmaNumber: { contains: prefix },
    },
    sort: '-rmaNumber',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let seq = 1
  const lastNumber = latest.docs[0]?.rmaNumber
  if (lastNumber?.startsWith(prefix)) {
    const parsed = Number.parseInt(lastNumber.slice(prefix.length), 10)
    if (Number.isFinite(parsed)) seq = parsed + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
