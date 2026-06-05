import { NextResponse } from 'next/server'

import { writeSubuserAudit } from '@/lib/auth/audit'
import { DEFAULT_SUBUSER_PERMISSIONS, parseB2bPermissions } from '@/lib/b2b/permissions'
import { requireB2bSuperadmin } from '@/lib/intranet/b2b-api-guard'
import { createCompanySubuser, listCompanySubusers } from '@/lib/intranet/subusers'
import { extractSourceIp } from '@/lib/request-ip'

export async function GET() {
  const session = await requireB2bSuperadmin()
  if ('error' in session) return session.error

  const subusers = await listCompanySubusers(session.customerId)
  return NextResponse.json({ subusers })
}

export async function POST(request: Request) {
  const session = await requireB2bSuperadmin()
  if ('error' in session) return session.error

  let body: {
    displayName?: string
    email?: string
    password?: string
    permissions?: Partial<typeof DEFAULT_SUBUSER_PERMISSIONS>
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const displayName = body.displayName?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!displayName || !email || !password || password.length < 8) {
    return NextResponse.json(
      { error: 'Nombre, email y contraseña (mín. 8 caracteres) son obligatorios' },
      { status: 400 },
    )
  }

  const permissions = {
    ...DEFAULT_SUBUSER_PERMISSIONS,
    ...parseB2bPermissions(body.permissions as never),
  }

  const result = await createCompanySubuser({
    customerId: session.customerId,
    email,
    password,
    displayName,
    permissions,
  })

  if ('error' in result) {
    const status = result.error.includes('already') ? 409 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  await writeSubuserAudit({
    actorUserId: session.ctx.userId,
    actorEmail: session.ctx.email,
    action: 'SUBUSER_CREATED',
    subuserId: result.id,
    customerId: session.customerId,
    metadata: { email, displayName, permissions },
    sourceIp: extractSourceIp(request),
  })

  return NextResponse.json({ id: result.id }, { status: 201 })
}
