import type { Endpoint } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'
import { merchantFeedEnabled } from '@/lib/feeds/merchant-center/storage'

function cmsPublicUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() ||
    'http://localhost:3001'
  ).replace(/\/$/, '')
}

function buildEnvStatus() {
  return {
    ga4Enabled: process.env.NEXT_PUBLIC_GA4_ENABLED !== 'false',
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null,
    merchantFeedEnabled: merchantFeedEnabled(),
    merchantFeedBaseUrl:
      process.env.MERCHANT_FEED_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
      null,
    feedPublicUrl: `${cmsPublicUrl()}/api/feeds/merchant-center.xml`,
  }
}

export const analyticsStatusEndpoint: Endpoint = {
  path: '/analytics/status',
  method: 'get',
  handler: async (req) => {
    if (!hasStaffRole(req.user, ['superadmin', 'mantenimiento'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const global = await req.payload.findGlobal({ slug: 'analyticsSettings', overrideAccess: true })
    return Response.json({
      ga4MeasurementId: global.ga4MeasurementId,
      merchantFeedEnabled: global.merchantFeedEnabled,
      lastFeedGeneratedAt: global.lastFeedGeneratedAt,
      feedOmittedCounts: global.feedOmittedCounts,
      consecutiveFeedFailures: global.consecutiveFeedFailures,
      lastFeedErrorMessage: global.lastFeedErrorMessage,
      env: buildEnvStatus(),
    })
  },
}

export const analyticsStatusUpdateEndpoint: Endpoint = {
  path: '/analytics/status',
  method: 'patch',
  handler: async (req) => {
    if (!hasStaffRole(req.user, ['superadmin', 'mantenimiento'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { ga4MeasurementId?: string; merchantFeedEnabled?: boolean }
    try {
      if (!req.json) {
        return Response.json({ error: 'Invalid JSON' }, { status: 400 })
      }
      body = (await req.json()) as typeof body
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    await req.payload.updateGlobal({
      slug: 'analyticsSettings',
      overrideAccess: true,
      data: {
        ga4MeasurementId: body.ga4MeasurementId,
        merchantFeedEnabled: body.merchantFeedEnabled,
      },
    })

    return Response.json({ ok: true })
  },
}
