import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuoteRequestPage } from "@/components/quotes/QuoteRequestPage";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { resolveCheckoutSegment } from "@/lib/checkout/segment";
import { isQuotesEnabled } from "@/lib/quotes/enabled";

export const metadata: Metadata = { title: "Solicitar presupuesto" };

export default async function PresupuestoRoutePage() {
  if (!isQuotesEnabled()) {
    redirect("/cart");
  }

  const ctx = await getCustomerContext();
  const segment = resolveCheckoutSegment(ctx);

  const billingLabel = ctx
    ? [
        ctx.billingAddressLine1,
        [ctx.billingPostalCode, ctx.billingCity].filter(Boolean).join(" "),
        ctx.billingCountry,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <QuoteRequestPage
      segment={segment}
      isLoggedIn={Boolean(ctx)}
      billingLabel={billingLabel || null}
      contactEmail={ctx?.email ?? null}
    />
  );
}
