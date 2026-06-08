import type { Metadata } from "next";
import { PurchaseHistoryPanel } from "@/components/intranet/PurchaseHistoryPanel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Histórico de pedidos" };

export default async function PedidosPage() {
  await guardEmpresaPage("/cuenta/empresa/pedidos");
  return <PurchaseHistoryPanel />;
}
