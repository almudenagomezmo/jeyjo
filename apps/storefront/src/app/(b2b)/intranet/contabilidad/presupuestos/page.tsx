import type { Metadata } from "next";
import { ErpQuotesPanel } from "@/components/intranet/contabilidad/ErpQuotesPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PresupuestosPage() {
  await guardIntranetPage("/intranet/contabilidad/presupuestos");
  return <ErpQuotesPanel />;
}
