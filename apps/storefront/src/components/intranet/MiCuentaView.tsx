import type { CustomerContext } from "@/lib/auth/customer-context";
import { canManageSubusers } from "@/lib/b2b/permissions";
import { customerGroupLabel } from "@/lib/intranet/navigation";
import { Card } from "@/components/ui/Card";
import { OrderApprovalsPanel } from "@/components/intranet/OrderApprovalsPanel";
import { SubusersPanel } from "@/components/intranet/SubusersPanel";

type MiCuentaViewProps = {
  ctx: CustomerContext;
};

function CompanyReadonlyCard({ ctx }: { ctx: CustomerContext }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Datos de empresa</h2>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-tertiary">Razón social</dt>
          <dd className="font-semibold">{ctx.commercialName}</dd>
        </div>
        {ctx.taxId && (
          <div>
            <dt className="text-text-tertiary">CIF</dt>
            <dd className="font-semibold">{ctx.taxId}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-tertiary">Grupo</dt>
          <dd className="font-semibold">{customerGroupLabel(ctx.customerGroup)}</dd>
        </div>
        {ctx.defaultPaymentMethod && (
          <div>
            <dt className="text-text-tertiary">Forma de pago</dt>
            <dd className="font-semibold">{ctx.defaultPaymentMethod}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

export function MiCuentaView({ ctx }: MiCuentaViewProps) {
  const isSuperadmin = canManageSubusers(ctx);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {isSuperadmin
            ? "Gestiona los datos de tu empresa y los usuarios subordinados."
            : "Consulta los datos de tu empresa."}
        </p>
      </div>

      <CompanyReadonlyCard ctx={ctx} />

      {isSuperadmin && (
        <>
          <section id="aprobaciones" className="space-y-3">
            <h2 className="text-lg font-bold">Pedidos por aprobar</h2>
            <OrderApprovalsPanel />
          </section>
          <SubusersPanel />
        </>
      )}
    </div>
  );
}
