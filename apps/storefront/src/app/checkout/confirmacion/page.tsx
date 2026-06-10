import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { mapOrderLineSnapshots } from "@/lib/analytics/ga4-purchase";
import {
  orderDeliveryLabel,
  orderStatusLabel,
} from "@/lib/orders/customer-order-labels";
import { parseCustomerOrderLines } from "@/lib/orders/parse-order-line-snapshots";
import { fetchCouponByCode } from "@/lib/coupon/fetch";
import { findPayloadOrderByNumber } from "@/lib/payments/payload-orders";

import { ConfirmacionClient } from "./ConfirmacionClient";

type PageProps = {
  searchParams: Promise<{ order?: string; paid?: string }>;
};

export default async function CheckoutConfirmacionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumber = params.order?.trim();
  const paid = params.paid === "1";

  if (!orderNumber) notFound();

  const order = await findPayloadOrderByNumber(orderNumber);
  if (!order) notFound();

  const lines = parseCustomerOrderLines(order.orderLineSnapshots);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingCost = order.shippingCost ?? 0;
  const total = order.amount ?? order.total ?? subtotal + shippingCost;

  let couponLabel: string | null = null;
  let couponDiscount = 0;
  if (order.couponCode) {
    const coupon = await fetchCouponByCode(order.couponCode);
    if (coupon) {
      couponLabel =
        coupon.discountType === "percent"
          ? `${coupon.discountValue}% de descuento`
          : `${coupon.discountValue.toFixed(2)} € de descuento`;
    }
    couponDiscount = Math.max(0, Math.round((subtotal + shippingCost - total) * 100) / 100);
  }

  const snapshot = mapOrderLineSnapshots(
    order.orderNumber ?? orderNumber,
    order.amount ?? order.total,
    order.shippingCost,
    order.orderLineSnapshots,
    paid,
  );

  return (
    <>
      <Suspense fallback={null}>
        <PurchaseTracker snapshot={snapshot} paid={paid} />
      </Suspense>
      <ConfirmacionClient
        orderNumber={order.orderNumber ?? orderNumber}
        paid={paid}
        statusLabel={orderStatusLabel(order.jeyjoStatus)}
        deliveryLabel={orderDeliveryLabel(order)}
        paymentMethodLabel={order.paymentMethodLabel ?? null}
        couponCode={order.couponCode ?? null}
        couponLabel={couponLabel}
        couponDiscount={couponDiscount}
        lines={lines}
        subtotal={subtotal}
        shippingCost={shippingCost}
        total={total}
        customerNotes={order.customerNotes ?? null}
      />
    </>
  );
}
