import { Container } from "@/components/layout/Container";
import { SearchBar } from "@/components/layout/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { SparklesIcon } from "@/components/ui/icons";
import { HomeSegmentToggle } from "@/components/home/HomeSegmentToggle";
import type { PriceMode } from "@/lib/types";

export function HomeHero({ priceMode }: { priceMode: PriceMode }) {
  return (
    <section className="border-b border-border-subtle">
      <Container className="py-12 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="primary" size="md" icon={<SparklesIcon size={12} />}>
            Buscador con IA · 30.000+ referencias
          </Badge>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Todo lo que tu oficina necesita,{" "}
            <span className="text-text-brand">en un solo clic.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[17px] text-text-secondary">
            Más de 30.000 referencias para particulares y empresas. Tarifas personalizadas, envío en
            24-48 h y atención humana cuando la necesites.
          </p>
          <div className="mt-5 flex justify-center">
            <HomeSegmentToggle initialMode={priceMode} />
          </div>
          <div className="mt-6 flex justify-center">
            <SearchBar />
          </div>
        </div>
      </Container>
    </section>
  );
}
