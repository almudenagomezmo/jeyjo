import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountAddressesClient } from "@/components/account/AccountAddressesClient";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const metadata: Metadata = { title: "Direcciones" };

export default async function AccountAddressesPage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/direcciones");

  return <AccountAddressesClient />;
}
