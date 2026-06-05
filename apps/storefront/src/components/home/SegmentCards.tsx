import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";

interface SegmentCardsProps {
  b2cCatalogHref: string;
  b2bCatalogHref: string;
}

export function SegmentCards({ b2cCatalogHref, b2bCatalogHref }: SegmentCardsProps) {
  return (
    <Container className="pt-10">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-start gap-4 p-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary-soft text-text-brand">
            <UserIcon size={22} />
          </span>
          <div className="flex-1">
            <Badge size="sm">Particulares</Badge>
            <h3 className="mt-2 text-xl font-extrabold tracking-tight">Compra individual</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Precios con IVA, pago con Bizum y Apple Pay, y entrega rápida a domicilio.
            </p>
            <Button variant="secondary" size="sm" className="mt-4" asChild>
              <Link href={b2cCatalogHref}>
                Ver ofertas para ti <ChevronRightIcon size={14} />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex items-start gap-4 border-ink bg-ink p-7 text-neutral-100">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary text-on-primary">
            <ShieldIcon size={22} />
          </span>
          <div className="flex-1">
            <Badge tone="primary" size="sm">
              Empresas y autónomos
            </Badge>
            <h3 className="mt-2 text-xl font-extrabold tracking-tight">Portal B2B</h3>
            <p className="mt-1 text-sm text-neutral-300">
              Tarifas pactadas, pedido rápido, subusuarios y facturas en tu área de cliente.
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href={b2bCatalogHref}>
                Solicitar acceso B2B <ChevronRightIcon size={14} />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
