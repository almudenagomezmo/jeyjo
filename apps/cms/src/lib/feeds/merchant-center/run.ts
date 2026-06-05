import type { Payload } from 'payload'

import { buildMerchantFeed } from '@/lib/feeds/merchant-center/fetch-catalog'
import { uploadMerchantFeedSnapshot } from '@/lib/feeds/merchant-center/storage'

export type MerchantFeedRunResult = {
  rowCount: number
  omitted: {
    missingImage: number
    missingPrice: number
    missingSku: number
  }
  generatedAt: string
}

export async function runMerchantFeedJob(payload: Payload): Promise<MerchantFeedRunResult> {
  const built = await buildMerchantFeed(payload)
  const generatedAt = new Date().toISOString()

  await uploadMerchantFeedSnapshot(built.xml, {
    generatedAt,
    rowCount: built.rows.length,
  })

  const global = await payload.findGlobal({ slug: 'analyticsSettings', overrideAccess: true })
  const previousFailures = global.consecutiveFeedFailures ?? 0

  await payload.updateGlobal({
    slug: 'analyticsSettings',
    overrideAccess: true,
    data: {
      lastFeedGeneratedAt: generatedAt,
      feedOmittedCounts: built.omitted,
      consecutiveFeedFailures: 0,
      lastFeedErrorAt: null,
      lastFeedErrorMessage: null,
      ...(previousFailures > 0 ? {} : {}),
    },
  })

  return {
    rowCount: built.rows.length,
    omitted: built.omitted,
    generatedAt,
  }
}

export async function recordMerchantFeedFailure(
  payload: Payload,
  message: string,
): Promise<number> {
  const global = await payload.findGlobal({ slug: 'analyticsSettings', overrideAccess: true })
  const failures = (global.consecutiveFeedFailures ?? 0) + 1
  const now = new Date().toISOString()

  await payload.updateGlobal({
    slug: 'analyticsSettings',
    overrideAccess: true,
    data: {
      consecutiveFeedFailures: failures,
      lastFeedErrorAt: now,
      lastFeedErrorMessage: message.slice(0, 500),
    },
  })

  return failures
}
