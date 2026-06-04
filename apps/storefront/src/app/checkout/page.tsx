import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { RedsysWalletScript } from "@/components/checkout/RedsysWalletScript";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { resolveCheckoutSegment } from "@/lib/checkout/segment";
import { fetchPaymentSettings } from "@/lib/payments/settings";

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

  const paymentSettings = segment === "b2c" ? await fetchPaymentSettings() : null;
  const redsysEnv = process.env.REDSYS_ENV === "prod" ? "prod" : "test";

  return (
    <>
      {paymentSettings && (
        <RedsysWalletScript
          enabled={paymentSettings.applePayEnabled || paymentSettings.googlePayEnabled}
          env={redsysEnv}
        />
      )}
      <CheckoutPage
        segment={segment}
        isLoggedIn={Boolean(ctx)}
        defaultPaymentMethod={ctx?.defaultPaymentMethod ?? null}
        billingLabel={billingLabel || null}
        paymentSettings={paymentSettings}
      />
    </>
  );
}
