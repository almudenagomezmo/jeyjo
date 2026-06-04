import type { PayloadRequest } from 'payload'

import { isStaff } from '@/access/staffRoles'
import { extractSourceIp } from '@/lib/request-ip'
import { writeSecurityAudit } from '@/lib/supabase-server'

export async function logAccessDenied(
  req: PayloadRequest,
  collection: string,
  operation: string,
): Promise<void> {
  if (!req.user || !isStaff(req.user)) return

  try {
    await writeSecurityAudit({
      action: 'ACCESS_DENIED',
      actorId: req.user.id,
      actorName: req.user.email ?? null,
      metadata: { collection, operation },
      sourceIp: extractSourceIp(req.headers),
    })
  } catch (error) {
    req.payload.logger.error({ err: error, collection }, 'Failed to log ACCESS_DENIED')
  }
}
