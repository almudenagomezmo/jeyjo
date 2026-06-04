import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Área de cliente" };

/**
 * Placeholder for the customer area. The full B2B portal (dashboard, orders,
 * quick-order, pricing, sub-users, RMA…) lives outside this storefront-core
 * scaffold — see the README roadmap.
 */
export default function AccountPage() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-12">
      <Card className="max-w-lg p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-text-brand">
          <ShieldIcon size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Área de cliente</h1>
        <p className="mt-2 text-text-secondary">
          El portal B2B (pedidos, pedido rápido, tarifas pactadas, subusuarios y RMA) forma parte de
          la siguiente fase del proyecto. Este scaffold cubre el núcleo de la tienda B2C.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Volver a la tienda</Link>
        </Button>
      </Card>
    </Container>
  );
}
