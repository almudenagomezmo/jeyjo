import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { resolveCheckoutSegment } from "@/lib/checkout/segment";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutRoutePage() {
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
    <CheckoutPage
      segment={segment}
      isLoggedIn={Boolean(ctx)}
      defaultPaymentMethod={ctx?.defaultPaymentMethod ?? null}
      billingLabel={billingLabel || null}
    />
  );
}
