import type { Metadata } from "next";
import { CustomTariffsPanel } from "@/components/intranet/CustomTariffsPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Precios especiales" };

export default async function PreciosPage() {
  await guardEmpresaPage("/cuenta/empresa/precios");
  return <CustomTariffsPanel />;
}
