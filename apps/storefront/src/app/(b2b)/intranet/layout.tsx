import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { IntranetBreadcrumb } from "@/components/intranet/IntranetBreadcrumb";
import { IntranetNav } from "@/components/intranet/IntranetNav";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";

export default async function IntranetLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/intranet");
  if (!isB2bValidated(ctx)) redirect("/cuenta?error=forbidden");

  const showMfaBanner = ctx.role === "b2b_superadmin" && !ctx.mfaEnabled;

  return (
    <Container className="py-8">
      <header className="mb-6 border-b border-border-subtle pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Intranet B2B</p>
        <h1 className="mt-1 text-2xl font-extrabold">{ctx.commercialName}</h1>
        {ctx.taxId && <p className="text-sm text-text-secondary">CIF: {ctx.taxId}</p>}
      </header>

      {showMfaBanner && (
        <div className="mb-6 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          Recomendamos activar la autenticación en dos pasos (MFA) para proteger tu cuenta de empresa. La
          activación estará disponible en una próxima actualización.
        </div>
      )}

      <IntranetBreadcrumb />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <IntranetNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
