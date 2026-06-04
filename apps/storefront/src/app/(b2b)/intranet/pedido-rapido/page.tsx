import type { Metadata } from "next";
import { QuickOrderPanel } from "@/components/intranet/QuickOrderPanel";
import { PortalSectionScaffold } from "@/components/intranet/PortalSectionScaffold";
import { isQuickOrderEnabled } from "@/lib/intranet/quick-order/enabled";

export const metadata: Metadata = { title: "Pedido rápido" };

export default function PedidoRapidoPage() {
  if (!isQuickOrderEnabled()) {
    return (
      <PortalSectionScaffold
        title="Pedido rápido"
        description="Introduce referencias manualmente o importa un Excel para reabastecer tu stock en minutos."
        roadmapRef="#24 quick-order-excel"
      />
    );
  }
  return <QuickOrderPanel />;
}
