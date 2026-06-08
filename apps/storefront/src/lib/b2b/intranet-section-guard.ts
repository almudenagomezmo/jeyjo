import { redirect } from 'next/navigation'

import type { CustomerContext } from '@/lib/auth/customer-context'
import { isB2bValidated } from '@/lib/auth/redirect'
import { isB2bPermissionsEnabled } from '@/lib/b2b/env'
import { canAccessSection, isB2bCompanyOwner, sectionForEmpresaPath } from '@/lib/b2b/permissions'

export function assertEmpresaSectionAccess(ctx: CustomerContext, pathname: string): void {
  if (!isB2bPermissionsEnabled()) return
  if (!ctx.isActive) redirect('/login?error=disabled')
  if (!isB2bValidated(ctx)) redirect('/cuenta?error=forbidden')

  const section = sectionForEmpresaPath(pathname)
  if (!section) return

  if (isB2bCompanyOwner(ctx) && pathname.startsWith('/cuenta/empresa/preferencias')) {
    return
  }

  if (!canAccessSection(ctx, section)) {
    redirect(`/cuenta?forbidden=${section}`)
  }
}

/** @deprecated Use assertEmpresaSectionAccess */
export function assertIntranetSectionAccess(ctx: CustomerContext, pathname: string): void {
  assertEmpresaSectionAccess(ctx, pathname)
}
