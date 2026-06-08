import type { Metadata } from "next";
import { InvoicesPanel } from "@/components/intranet/contabilidad/InvoicesPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Facturas emitidas" };

export default async function FacturasPage() {
  await guardEmpresaPage("/cuenta/empresa/contabilidad/facturas");
  return <InvoicesPanel />;
}
