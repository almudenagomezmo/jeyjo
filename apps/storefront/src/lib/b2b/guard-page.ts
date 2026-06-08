import { redirect } from "next/navigation";

import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";
import { assertEmpresaSectionAccess } from "@/lib/b2b/intranet-section-guard";

export async function guardEmpresaPage(pathname: string): Promise<void> {
  const ctx = await getCustomerContext();
  if (!ctx) redirect(`/login?next=${pathname}`);
  if (!ctx.isActive) redirect("/login?error=disabled");
  if (!isB2bValidated(ctx)) redirect("/cuenta?error=forbidden");
  assertEmpresaSectionAccess(ctx, pathname);
}

/** @deprecated Use guardEmpresaPage */
export async function guardIntranetPage(pathname: string): Promise<void> {
  await guardEmpresaPage(pathname);
}
