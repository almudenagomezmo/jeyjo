import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { mapOrderLineSnapshots } from "@/lib/analytics/ga4-purchase";
import { findPayloadOrderByNumber } from "@/lib/payments/payload-orders";

import { ConfirmacionClient } from "./ConfirmacionClient";

type PageProps = {
  searchParams: Promise<{ order?: string; paid?: string }>;
};

export default async function CheckoutConfirmacionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumber = params.order?.trim();
  const paid = params.paid === "1";

  let snapshot = null;
  if (orderNumber) {
    const order = await findPayloadOrderByNumber(orderNumber);
    if (!order) notFound();
    snapshot = mapOrderLineSnapshots(
      order.orderNumber ?? orderNumber,
      order.amount ?? order.total,
      order.shippingCost,
      order.orderLineSnapshots,
      paid,
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <PurchaseTracker snapshot={snapshot} paid={paid} />
      </Suspense>
      <ConfirmacionClient
        orderNumber={orderNumber ?? null}
        paid={paid}
        lineItems={snapshot?.items ?? []}
        total={snapshot?.total}
      />
    </>
  );
}
