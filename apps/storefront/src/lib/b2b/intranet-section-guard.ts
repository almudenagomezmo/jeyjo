import { redirect } from 'next/navigation'

import type { CustomerContext } from '@/lib/auth/customer-context'
import { isB2bValidated } from '@/lib/auth/redirect'
import { isB2bPermissionsEnabled } from '@/lib/b2b/env'
import { canAccessSection, sectionForIntranetPath } from '@/lib/b2b/permissions'

export function assertIntranetSectionAccess(ctx: CustomerContext, pathname: string): void {
  if (!isB2bPermissionsEnabled()) return
  if (!ctx.isActive) redirect('/login?error=disabled')
  if (!isB2bValidated(ctx)) redirect('/cuenta?error=forbidden')

  const section = sectionForIntranetPath(pathname)
  if (!section) return

  if (ctx.role === 'b2b_superadmin' && pathname.startsWith('/intranet/mi-cuenta')) {
    return
  }

  if (!canAccessSection(ctx, section)) {
    redirect(`/intranet?forbidden=${section}`)
  }
}
