export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  pending_payment: "Pendiente de pago",
  pending_company_approval: "Pendiente aprobación empresa",
  pending_confirmation: "Pendiente de confirmación",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_DELIVERY_LABELS: Record<string, string> = {
  home: "Envío a domicilio",
  alternate_address: "Envío a dirección guardada",
  pickup_alfaro: "Recogida Alfaro",
  pickup_rincon: "Recogida Rincón de Soto",
};

export function orderStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function orderDeliveryLabel(order: {
  deliveryMethod: string | null;
  pickupStoreLabel: string | null;
}): string {
  if (order.pickupStoreLabel) return order.pickupStoreLabel;
  if (order.deliveryMethod) {
    return ORDER_DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod;
  }
  return "—";
}
