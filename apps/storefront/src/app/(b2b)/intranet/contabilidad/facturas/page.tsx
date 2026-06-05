import type { Metadata } from "next";
import { InvoicesPanel } from "@/components/intranet/contabilidad/InvoicesPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Facturas emitidas" };

export default async function FacturasPage() {
  await guardIntranetPage("/intranet/contabilidad/facturas");
  return <InvoicesPanel />;
}
