import Link from "next/link";
import type { CustomerContext } from "@/lib/auth/customer-context";
import { filterEmpresaNav } from "@/lib/b2b/permissions";
import { customerGroupLabel, EMPRESA_PRIMARY_NAV } from "@/lib/intranet/navigation";
import { OrderApprovalsBadge } from "@/components/intranet/OrderApprovalsPanel";
import { Card } from "@/components/ui/Card";

type IntranetDashboardProps = {
  ctx: CustomerContext;
  pendingApprovalCount?: number;
  forbiddenSection?: string | null;
};

const FORBIDDEN_LABELS: Record<string, string> = {
  finance: "contabilidad / finanzas",
  orders: "pedidos y operaciones comerciales",
  account: "datos de cuenta",
};

export function IntranetDashboard({
  ctx,
  pendingApprovalCount = 0,
  forbiddenSection = null,
}: IntranetDashboardProps) {
  const sections = filterEmpresaNav(EMPRESA_PRIMARY_NAV, ctx);

  return (
    <div className="space-y-8">
      {forbiddenSection && (
        <div className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          No tienes permiso para acceder a la sección de{" "}
          {FORBIDDEN_LABELS[forbiddenSection] ?? forbiddenSection}.
        </div>
      )}

      {ctx.role === "b2b_superadmin" && pendingApprovalCount > 0 && (
        <OrderApprovalsBadge count={pendingApprovalCount} />
      )}

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Resumen de empresa</p>
        <h2 className="mt-1 text-xl font-extrabold">{ctx.commercialName}</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {ctx.taxId && (
            <div>
              <dt className="text-text-tertiary">CIF</dt>
              <dd className="font-semibold">{ctx.taxId}</dd>
            </div>
          )}
          <div>
            <dt className="text-text-tertiary">Grupo de cliente</dt>
            <dd className="font-semibold">{customerGroupLabel(ctx.customerGroup)}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="text-lg font-bold">Accesos rápidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const href =
              section.href === "/cuenta/empresa/contabilidad"
                ? "/cuenta/empresa/contabilidad/facturas"
                : section.href;
            const description =
              section.scaffold?.description ??
              (section.children
                ? "Facturas, albaranes, vencimientos y más documentación contable."
                : null);
            return (
              <Link key={section.href} href={href} className="group flex h-full">
                <Card className="flex h-full w-full flex-col p-4 transition-colors group-hover:border-border">
                  <p className="font-semibold text-text-primary">{section.label}</p>
                  <p className="mt-1 min-h-10 line-clamp-2 text-xs text-text-secondary">
                    {description ?? "\u00A0"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
