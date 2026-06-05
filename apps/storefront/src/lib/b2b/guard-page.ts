import { redirect } from "next/navigation";

import { getCustomerContext } from "@/lib/auth/customer-context";
import { assertIntranetSectionAccess } from "@/lib/b2b/intranet-section-guard";

export async function guardIntranetPage(pathname: string): Promise<void> {
  const ctx = await getCustomerContext();
  if (!ctx) redirect(`/login?next=${pathname}`);
  assertIntranetSectionAccess(ctx, pathname);
}
