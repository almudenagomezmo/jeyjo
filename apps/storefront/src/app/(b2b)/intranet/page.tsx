import type { Metadata } from "next";
import { IntranetDashboard } from "@/components/intranet/IntranetDashboard";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = { title: "Portal B2B" };

export default async function IntranetDashboardPage() {
  const ctx = await getCustomerContext();
  if (!ctx) return null;

  return <IntranetDashboard ctx={ctx} />;
}
