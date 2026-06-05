import type { Metadata } from "next";
import { CustomTariffsPanel } from "@/components/intranet/CustomTariffsPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Precios especiales" };

export default async function PreciosPage() {
  await guardIntranetPage("/intranet/precios");
  return <CustomTariffsPanel />;
}
