import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { LeafIcon, RefreshIcon, ShieldIcon, SparklesIcon, TruckIcon } from "@/components/ui/icons";

const TRUST_ITEMS = [
  { icon: <TruckIcon size={20} />, t: "Envío en 24-48 h", s: "Gratis desde 39 € (B2C) o 10 € (B2B)" },
  { icon: <SparklesIcon size={20} />, t: "EVA · IA 24/7", s: "Resuelve dudas y crea pedidos al instante" },
  { icon: <ShieldIcon size={20} />, t: "Pago seguro", s: "Redsys, Bizum, PayPal, Apple Pay" },
  { icon: <RefreshIcon size={20} />, t: "Devolución 14 días", s: "Gestión de RMA online" },
] as const;

export function TrustStrip() {
  return (
    <>
      <Container className="pt-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((b) => (
            <Card key={b.t} className="flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-text-brand">
                {b.icon}
              </span>
              <div>
                <p className="text-sm font-bold">{b.t}</p>
                <p className="mt-0.5 text-xs text-text-tertiary">{b.s}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
      <div className="flex items-center justify-center gap-2 pt-12 text-xs text-text-tertiary">
        <LeafIcon size={14} /> Empresa comprometida con el material reciclado y de bajo impacto.
      </div>
    </>
  );
}
