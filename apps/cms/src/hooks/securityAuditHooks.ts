import type { AfterErrorHook, CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'

import { isStaff } from '@/access/staffRoles'
import { extractSourceIp, writeSecurityAudit } from '@/lib/supabase-server'

const trackPasswordChange: CollectionBeforeChangeHook = ({ data, context }) => {
  if (data?.password) {
    context.staffPasswordChanged = true
  }
  return data
}

export const staffSecurityBeforeChange = trackPasswordChange

export const staffSecurityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'update' || !doc?.id) return doc

  try {
    const prevRoles = previousDoc?.staffRoles ?? []
    const nextRoles = doc.staffRoles ?? []
    if (JSON.stringify(prevRoles) !== JSON.stringify(nextRoles)) {
      await writeSecurityAudit({
        action: 'ROLE_CHANGED',
        actorId: req.user?.id ?? null,
        actorName: req.user?.email ?? null,
        entityId: doc.id,
        previousValue: { staffRoles: prevRoles },
        metadata: { staffRoles: nextRoles },
        sourceIp: extractSourceIp(req.headers),
      })
    }

    if (context.staffPasswordChanged) {
      await writeSecurityAudit({
        action: 'PASSWORD_CHANGED',
        actorId: req.user?.id ?? null,
        actorName: req.user?.email ?? null,
        entityId: doc.id,
        sourceIp: extractSourceIp(req.headers),
      })
    }
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Failed to write staff security audit')
  }

  return doc
}

export const loginFailedAfterError: AfterErrorHook = async (args) => {
  const { error, req, collection } = args
  if (!collection || collection.slug !== 'users') return args

  const url = req.url || ''
  if (!url.includes('/login')) return args

  const email = (req.data as { email?: string } | undefined)?.email

  if (!email) return args

  try {
    const users = await req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const user = users.docs[0]
    if (user && isStaff(user)) {
      await writeSecurityAudit({
        action: 'LOGIN_FAILED',
        actorName: email,
        entityId: user.id,
        metadata: { email },
        sourceIp: extractSourceIp(req.headers),
      })
    }
  } catch (auditError) {
    req.payload.logger.error({ err: auditError }, 'Failed to log LOGIN_FAILED')
  }

  return undefined
}
