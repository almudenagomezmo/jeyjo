import type { Metadata } from "next";
import { DuePaymentsPanel } from "@/components/intranet/contabilidad/DuePaymentsPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Vencimientos" };

export default async function VencimientosPage() {
  await guardIntranetPage("/intranet/contabilidad/vencimientos");
  return <DuePaymentsPanel />;
}
