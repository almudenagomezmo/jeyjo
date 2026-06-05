import { redirect } from "next/navigation";
import { IntranetSubNav } from "@/components/intranet/IntranetSubNav";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { assertIntranetSectionAccess } from "@/lib/b2b/intranet-section-guard";

export default async function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/intranet");
  assertIntranetSectionAccess(ctx, "/intranet/contabilidad/facturas");

  return (
    <>
      <IntranetSubNav />
      {children}
    </>
  );
}
