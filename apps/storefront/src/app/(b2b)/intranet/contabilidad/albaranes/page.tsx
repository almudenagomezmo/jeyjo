import type { Metadata } from "next";
import { DeliveryNotesPanel } from "@/components/intranet/contabilidad/DeliveryNotesPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Albaranes" };

export default async function AlbaranesPage() {
  await guardIntranetPage("/intranet/contabilidad/albaranes");
  return <DeliveryNotesPanel />;
}
