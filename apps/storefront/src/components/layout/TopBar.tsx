import { Container } from "@/components/layout/Container";
import { BoxIcon, ShieldIcon, SparklesIcon, TruckIcon } from "@/components/ui/icons";

const messages = [
  { icon: <TruckIcon size={14} />, text: "Envío gratis a partir de 39 € · 24-48 h" },
  { icon: <SparklesIcon size={14} />, text: "Asistente EVA: dudas y pedidos 24/7" },
  { icon: <ShieldIcon size={14} />, text: "Pago seguro · Redsys, Bizum, PayPal" },
];

export function TopBar() {
  return (
    <div className="bg-ink text-[12px] text-neutral-200">
      <Container className="flex h-9 items-center justify-between">
        <div className="flex gap-6 overflow-hidden">
          {messages.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-green-300">{m.icon}</span>
              {m.text}
            </span>
          ))}
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <a href="tel:+34941234567" className="inline-flex items-center gap-1 opacity-80 hover:opacity-100">
            <BoxIcon size={12} /> 941 23 45 67
          </a>
          <span className="opacity-40">·</span>
          <span className="opacity-80">Empresas B2B · tarifas pactadas</span>
        </div>
      </Container>
    </div>
  );
}
