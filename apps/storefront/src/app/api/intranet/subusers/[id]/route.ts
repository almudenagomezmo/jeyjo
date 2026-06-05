import { NextResponse } from 'next/server'

import { writeSubuserAudit } from '@/lib/auth/audit'
import { parseB2bPermissions } from '@/lib/b2b/permissions'
import { requireB2bSuperadmin } from '@/lib/intranet/b2b-api-guard'
import { updateCompanySubuser } from '@/lib/intranet/subusers'
import { extractSourceIp } from '@/lib/request-ip'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireB2bSuperadmin()
  if ('error' in session) return session.error

  const { id } = await context.params

  let body: {
    displayName?: string
    password?: string
    isActive?: boolean
    permissions?: Record<string, unknown>
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await updateCompanySubuser({
    customerId: session.customerId,
    subuserId: id,
    displayName: body.displayName,
    password: body.password,
    isActive: body.isActive,
    permissions: body.permissions ? parseB2bPermissions(body.permissions as never) : undefined,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const action =
    body.isActive === false
      ? 'SUBUSER_DEACTIVATED'
      : ('SUBUSER_UPDATED' as const)

  await writeSubuserAudit({
    actorUserId: session.ctx.userId,
    actorEmail: session.ctx.email,
    action,
    subuserId: id,
    customerId: session.customerId,
    metadata: {
      displayName: body.displayName,
      isActive: body.isActive,
      permissions: body.permissions,
    },
    sourceIp: extractSourceIp(request),
  })

  return NextResponse.json({ ok: true })
}
