import type { Metadata } from "next";
import { ErpQuotesPanel } from "@/components/intranet/contabilidad/ErpQuotesPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PresupuestosPage() {
  await guardEmpresaPage("/cuenta/empresa/contabilidad/presupuestos");
  return <ErpQuotesPanel />;
}
