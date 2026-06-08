export type CustomerOrderLine = {
  lineId: string | null;
  skuErp: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export function parseCustomerOrderLines(raw: unknown): CustomerOrderLine[] {
  if (!Array.isArray(raw)) return [];

  const lines: CustomerOrderLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const skuErp = String(row.skuErp ?? row.sku ?? "").trim();
    const qty = Number(row.qty ?? row.quantity ?? 0);
    const unitPrice = Number(row.unitPrice ?? row.price ?? 0);
    if (!skuErp || !Number.isFinite(qty) || qty <= 0) continue;

    const safeUnit = Number.isFinite(unitPrice) ? unitPrice : 0;
    const lineTotalRaw = row.lineTotal != null ? Number(row.lineTotal) : safeUnit * qty;
    const lineTotal = Number.isFinite(lineTotalRaw) ? lineTotalRaw : safeUnit * qty;

    lines.push({
      lineId: row.lineId != null ? String(row.lineId) : null,
      skuErp,
      name: row.name != null ? String(row.name) : skuErp,
      qty,
      unitPrice: safeUnit,
      lineTotal,
    });
  }
  return lines;
}
