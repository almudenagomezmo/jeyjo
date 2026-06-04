import { Container } from "@/components/layout/Container";
import { BoxIcon, ShieldIcon, SparklesIcon, TruckIcon } from "@/components/ui/icons";
import { TOP_BAR_MESSAGES, type TopBarMessageIcon } from "@/config/top-bar-messages";

const ICONS: Record<TopBarMessageIcon, React.ReactNode> = {
  truck: <TruckIcon size={14} />,
  sparkles: <SparklesIcon size={14} />,
  shield: <ShieldIcon size={14} />,
};

export function TopBar() {
  return (
    <div className="bg-ink text-[12px] text-neutral-200">
      <Container className="flex h-9 items-center justify-between">
        <div className="flex gap-6 overflow-hidden">
          {TOP_BAR_MESSAGES.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-green-300">{ICONS[m.icon]}</span>
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
