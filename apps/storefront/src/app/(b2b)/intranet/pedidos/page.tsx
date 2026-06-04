import type { Metadata } from "next";
import { PurchaseHistoryPanel } from "@/components/intranet/PurchaseHistoryPanel";

export const metadata: Metadata = { title: "Histórico de pedidos" };

export default function PedidosPage() {
  return <PurchaseHistoryPanel />;
}
