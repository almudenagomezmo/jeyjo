import { Container } from "@/components/layout/Container";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";
import { filterEmpresaNav } from "@/lib/b2b/permissions";
import { EMPRESA_PRIMARY_NAV } from "@/lib/intranet/navigation";

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  const empresaLinks = ctx && isB2bValidated(ctx) ? filterEmpresaNav(EMPRESA_PRIMARY_NAV, ctx) : [];

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountSidebar empresaLinks={empresaLinks} />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
