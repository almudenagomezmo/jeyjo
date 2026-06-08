import type { Metadata } from "next";
import { RmaIncidentsPanel } from "@/components/intranet/RmaIncidentsPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "RMA e incidencias" };

export default async function RmaPage() {
  await guardEmpresaPage("/cuenta/empresa/rma");
  return <RmaIncidentsPanel />;
}
