import type { Metadata } from "next";
import { DuePaymentsPanel } from "@/components/intranet/contabilidad/DuePaymentsPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Vencimientos" };

export default async function VencimientosPage() {
  await guardEmpresaPage("/cuenta/empresa/contabilidad/vencimientos");
  return <DuePaymentsPanel />;
}
