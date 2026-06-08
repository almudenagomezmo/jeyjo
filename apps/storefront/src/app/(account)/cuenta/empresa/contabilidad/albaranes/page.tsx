import type { Metadata } from "next";
import { DeliveryNotesPanel } from "@/components/intranet/contabilidad/DeliveryNotesPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Albaranes" };

export default async function AlbaranesPage() {
  await guardEmpresaPage("/cuenta/empresa/contabilidad/albaranes");
  return <DeliveryNotesPanel />;
}
