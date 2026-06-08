import type { GlobalAfterChangeHook, GlobalBeforeChangeHook } from 'payload'

import { extractSourceIp } from '@/lib/request-ip'
import { writeAuditLog } from '@/lib/supabase-server'

const AUDIT_FIELDS = [
  'showStores',
  'showSocial',
  'socialFacebook',
  'socialInstagram',
  'socialLinkedin',
  'socialYoutube',
  'blogEnabled',
  'blogLabel',
  'euFundingEnabled',
  'euFundingAlt',
  'euFundingUrl',
] as const

function pickSnapshot(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of AUDIT_FIELDS) {
    if (key in doc) out[key] = doc[key]
  }
  if ('euFundingImage' in doc) {
    const img = doc.euFundingImage
    out.euFundingImage =
      img && typeof img === 'object' && img !== null && 'id' in img
        ? (img as { id: unknown }).id
        : img
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

export const footerSettingsBeforeChange: GlobalBeforeChangeHook[] = [
  ({ data, originalDoc, context }) => {
    if (originalDoc) {
      context.auditPrevious = pickSnapshot(originalDoc as Record<string, unknown>)
    }
    if (data?.euFundingEnabled && data?.euFundingImage && !data?.euFundingAlt?.trim()) {
      throw new Error('euFundingAlt: el texto alternativo es obligatorio cuando hay imagen UE')
    }
    return data
  },
]

export const footerSettingsAfterChange: GlobalAfterChangeHook[] = [
  async ({ doc, req, context }) => {
    try {
      const { actorId, actorName } = actorFromReq(req)
      const current = pickSnapshot(doc as Record<string, unknown>)
      const previous = context.auditPrevious as Record<string, unknown> | undefined

      await writeAuditLog({
        actorId,
        actorName,
        entityType: 'footerSettings',
        entityId: 'footerSettings',
        action: 'update',
        metadata: current,
        previousValue: previous ?? null,
        sourceIp: extractSourceIp(req.headers),
      })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Failed to write footerSettings audit log')
    }
    return doc
  },
]
