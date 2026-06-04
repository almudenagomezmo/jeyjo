import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload | undefined
let dbAvailable = false

describe('API', () => {
  beforeAll(async () => {
    process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-payload-secret-for-vitest'

    if (!process.env.DATABASE_URL) {
      return
    }

    try {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })
      dbAvailable = true
    } catch {
      dbAvailable = false
    }
  })

  it('fetches users', async ({ skip }) => {
    if (!dbAvailable || !payload) {
      skip()
    }

    const users = await payload!.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('rejects unauthenticated product create', async ({ skip }) => {
    if (!dbAvailable || !payload) {
      skip()
    }

    await expect(
      payload!.create({
        collection: 'products',
        data: {
          title: 'Unauthorized product',
          slug: 'unauthorized-product',
          _status: 'published',
        },
        overrideAccess: false,
        user: undefined,
      }),
    ).rejects.toThrow()
  })
})
