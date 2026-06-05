import type { GlobalAfterChangeHook, GlobalBeforeChangeHook } from 'payload'

import { extractSourceIp } from '@/lib/request-ip'
import { writeAuditLog } from '@/lib/supabase-server'

const AUDIT_FIELDS = [
  'shippingB2cThreshold',
  'shippingB2cCost',
  'shippingB2bThreshold',
  'shippingB2bCost',
  'stockLowThreshold',
  'topSalesWindowDays',
  'dashboardLowStockThreshold',
  'catalogStalenessHours',
  'supportPhone',
  'supportEmail',
  'whatsapp',
  'storeAlfaroName',
  'storeAlfaroAddress',
  'storeRinconName',
  'storeRinconAddress',
  'predictiveSearchEnabled',
  'suggestLimit',
  'minQueryLength',
] as const

function pickSnapshot(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of AUDIT_FIELDS) {
    if (key in doc) out[key] = doc[key]
  }
  return out
}

function actorFromReq(req: {
  user?: { id?: number | string; email?: string; name?: string | null } | null
}) {
  return {
    actorId: req.user?.id ?? null,
    actorName: req.user?.email ?? req.user?.name ?? null,
  }
}

export const systemSettingsBeforeChange: GlobalBeforeChangeHook[] = [
  ({ data, originalDoc, context }) => {
    if (originalDoc) {
      context.auditPrevious = pickSnapshot(originalDoc as Record<string, unknown>)
    }
    return data
  },
]

export const systemSettingsAfterChange: GlobalAfterChangeHook[] = [
  async ({ doc, req, context }) => {
    try {
      const { actorId, actorName } = actorFromReq(req)
      const current = pickSnapshot(doc as Record<string, unknown>)
      const previous = context.auditPrevious as Record<string, unknown> | undefined

      await writeAuditLog({
        actorId,
        actorName,
        entityType: 'systemSettings',
        entityId: 'systemSettings',
        action: 'update',
        metadata: current,
        previousValue: previous ?? null,
        sourceIp: extractSourceIp(req.headers),
      })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Failed to write systemSettings audit log')
    }
    return doc
  },
]
