import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForbiddenBanner } from "@/components/account/ForbiddenBanner";
import { LogoutButton } from "@/components/account/LogoutButton";
import { PendingValidationBanner } from "@/components/account/PendingValidationBanner";
import { StockWatchesQuickAccessCard } from "@/components/account/StockWatchesQuickAccessCard";
import { IntranetDashboard } from "@/components/intranet/IntranetDashboard";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";
import { canManageSubusers } from "@/lib/b2b/permissions";
import { countPendingCompanyApprovalOrders } from "@/lib/intranet/order-approvals";

export const metadata: Metadata = { title: "Área de cliente" };

type PageProps = {
  searchParams: Promise<{ error?: string; forbidden?: string }>;
};

export default async function AccountDashboardPage({ searchParams }: PageProps) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta");

  const params = await searchParams;
  const isB2b = isB2bValidated(ctx);
  const groupLabel = !ctx.validatedAt
    ? "Pendiente de validación"
    : ctx.customerGroup === 1
      ? "Particular (B2C)"
      : `Empresa (grupo ${ctx.customerGroup})`;

  const pendingApprovalCount =
    isB2b && canManageSubusers(ctx) ? await countPendingCompanyApprovalOrders(ctx.customerId) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{ctx.commercialName}</h1>
          <p className="mt-1 text-sm text-text-secondary">{ctx.email}</p>
        </div>
        <LogoutButton />
      </div>

      {params.error === "forbidden" && <ForbiddenBanner />}
      {!ctx.validatedAt && <PendingValidationBanner />}

      <Card className="p-6">
        <h2 className="text-lg font-bold">Resumen</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-tertiary">Estado</dt>
            <dd className="font-semibold">{groupLabel}</dd>
          </div>
          {ctx.taxId && (
            <div>
              <dt className="text-text-tertiary">CIF / NIF</dt>
              <dd className="font-semibold">{ctx.taxId}</dd>
            </div>
          )}
          {ctx.phone && (
            <div>
              <dt className="text-text-tertiary">Teléfono</dt>
              <dd className="font-semibold">{ctx.phone}</dd>
            </div>
          )}
        </dl>
      </Card>

      <StockWatchesQuickAccessCard />

      {isB2b && (
        <IntranetDashboard
          ctx={ctx}
          pendingApprovalCount={pendingApprovalCount}
          forbiddenSection={params.forbidden ?? null}
        />
      )}
    </div>
  );
}
