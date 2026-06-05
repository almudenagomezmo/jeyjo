import Link from "next/link";
import type { CustomerContext } from "@/lib/auth/customer-context";
import { filterIntranetNav } from "@/lib/b2b/permissions";
import { customerGroupLabel, INTRANET_PRIMARY_NAV } from "@/lib/intranet/navigation";
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
  const sections = filterIntranetNav(INTRANET_PRIMARY_NAV, ctx);

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
              section.href === "/intranet/contabilidad"
                ? "/intranet/contabilidad/facturas"
                : section.href;
            return (
              <Link key={section.href} href={href} className="group block">
                <Card className="p-4 transition-colors group-hover:border-border">
                  <p className="font-semibold text-text-primary">{section.label}</p>
                  {section.scaffold && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{section.scaffold.description}</p>
                  )}
                  {section.children && (
                    <p className="mt-1 text-xs text-text-secondary">
                      Facturas, albaranes, vencimientos y más documentación contable.
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
