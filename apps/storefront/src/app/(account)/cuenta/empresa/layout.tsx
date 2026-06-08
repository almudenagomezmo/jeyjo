import { redirect } from "next/navigation";
import { IntranetBreadcrumb } from "@/components/intranet/IntranetBreadcrumb";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";
import { EvaWidgetShell } from "@/components/eva/EvaWidgetShell";

export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/empresa");
  if (!ctx.isActive) redirect("/login?error=disabled");
  if (!isB2bValidated(ctx)) redirect("/cuenta?error=forbidden");

  const showMfaBanner = ctx.role === "b2b_superadmin" && !ctx.mfaEnabled;

  return (
    <div className="space-y-6">
      <header className="border-b border-border-subtle pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Área empresa</p>
        <h2 className="mt-1 text-xl font-extrabold">{ctx.commercialName}</h2>
        {ctx.taxId && <p className="text-sm text-text-secondary">CIF: {ctx.taxId}</p>}
      </header>

      {showMfaBanner && (
        <div className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          Recomendamos activar la autenticación en dos pasos (MFA) para proteger tu cuenta de empresa. La
          activación estará disponible en una próxima actualización.
        </div>
      )}

      <IntranetBreadcrumb />
      <div className="min-w-0">{children}</div>
      <EvaWidgetShell channel="intranet" />
    </div>
  );
}
