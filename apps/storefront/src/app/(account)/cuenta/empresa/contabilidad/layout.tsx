import { redirect } from "next/navigation";
import { IntranetSubNav } from "@/components/intranet/IntranetSubNav";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { assertEmpresaSectionAccess } from "@/lib/b2b/intranet-section-guard";

export default async function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/empresa/contabilidad");
  assertEmpresaSectionAccess(ctx, "/cuenta/empresa/contabilidad/facturas");

  return (
    <>
      <IntranetSubNav />
      {children}
    </>
  );
}
