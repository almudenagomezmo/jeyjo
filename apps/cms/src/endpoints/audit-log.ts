import { APIError, type Endpoint } from 'payload'

import { canAccessAuditConsole } from '@/access/staffRoles'
import { hasValidMfaSession } from '@/lib/mfa-session'
import { queryAuditLog, queryAuditLogForExport } from '@/lib/supabase-server'

function parseQuery(url: string) {
  const { searchParams } = new URL(url)
  return {
    actor: searchParams.get('actor') || undefined,
    entityType: searchParams.get('entityType') || undefined,
    action: searchParams.get('action') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    export: searchParams.get('export') === 'true',
  }
}

function assertAuditAccess(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  if (!req.user) throw new APIError('Unauthorized', 401)
  if (!canAccessAuditConsole(req.user)) throw new APIError('Forbidden', 403)
  if (!hasValidMfaSession(req)) throw new APIError('MFA required', 403)
}

export const auditLogEndpoint: Endpoint = {
  path: '/audit-log',
  method: 'get',
  handler: async (req) => {
    assertAuditAccess(req)

    const query = parseQuery(req.url || '')

    if (query.export) {
      const user = req.user!
      if (!user.staffRoles?.includes('superadmin')) {
        throw new APIError('Export requires superadmin', 403)
      }

      const rows = await queryAuditLogForExport({
        actor: query.actor,
        entityType: query.entityType,
        action: query.action,
        from: query.from,
        to: query.to,
      })

      const header = ['created_at', 'actor_name', 'action', 'entity_type', 'entity_id', 'source_ip']
      const csvLines = [
        header.join(','),
        ...rows.map((row) =>
          [
            row.created_at,
            JSON.stringify(row.actor_name ?? ''),
            row.action,
            row.entity_type,
            row.entity_id ?? '',
            row.source_ip ?? '',
          ].join(','),
        ),
      ]

      return new Response(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-log.csv"',
        },
      })
    }

    const result = await queryAuditLog(query)
    return Response.json(result)
  },
}
