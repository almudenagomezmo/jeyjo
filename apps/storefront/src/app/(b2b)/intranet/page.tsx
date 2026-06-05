import type { Metadata } from "next";

import { IntranetDashboard } from "@/components/intranet/IntranetDashboard";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { canManageSubusers } from "@/lib/b2b/permissions";
import { countPendingCompanyApprovalOrders } from "@/lib/intranet/order-approvals";

export const metadata: Metadata = { title: "Portal B2B" };

type PageProps = {
  searchParams: Promise<{ forbidden?: string }>;
};

export default async function IntranetDashboardPage({ searchParams }: PageProps) {
  const ctx = await getCustomerContext();
  if (!ctx) return null;

  const params = await searchParams;
  const pendingApprovalCount = canManageSubusers(ctx)
    ? await countPendingCompanyApprovalOrders(ctx.customerId)
    : 0;

  return (
    <IntranetDashboard
      ctx={ctx}
      pendingApprovalCount={pendingApprovalCount}
      forbiddenSection={params.forbidden ?? null}
    />
  );
}
