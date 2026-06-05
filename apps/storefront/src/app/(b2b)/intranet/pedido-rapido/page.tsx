import type { Metadata } from "next";
import { QuickOrderPanel } from "@/components/intranet/QuickOrderPanel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Pedido rápido" };

export default async function PedidoRapidoPage() {
  await guardIntranetPage("/intranet/pedido-rapido");
  return <QuickOrderPanel />;
}
