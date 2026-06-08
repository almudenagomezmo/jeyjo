import type { Metadata } from "next";
import { QuickOrderPanel } from "@/components/intranet/QuickOrderPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Pedido rápido" };

export default async function PedidoRapidoPage() {
  await guardEmpresaPage("/cuenta/empresa/pedido-rapido");
  return <QuickOrderPanel />;
}
