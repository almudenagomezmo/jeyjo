import Link from "next/link";
import type { CustomerContext } from "@/lib/auth/customer-context";
import { customerGroupLabel, getQuickAccessSections } from "@/lib/intranet/navigation";
import { Card } from "@/components/ui/Card";

type IntranetDashboardProps = {
  ctx: CustomerContext;
};

export function IntranetDashboard({ ctx }: IntranetDashboardProps) {
  const sections = getQuickAccessSections();

  return (
    <div className="space-y-8">
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
