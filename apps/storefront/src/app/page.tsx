import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SparklesIcon } from "@/components/ui/icons";

/**
 * Home de fundación: valida shell + design tokens sin depender del catálogo mock.
 * El home completo con carruseles vuelve en el cambio `home-segmented-banners`.
 */
export default function HomePage() {
  return (
    <div className="animate-fade-up">
      <section className="border-b border-border-subtle">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="primary" size="md" icon={<SparklesIcon size={12} />}>
              Fundación monorepo
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Jeyjo · <span className="text-text-brand">Material de oficina</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[17px] text-text-secondary">
              Base técnica del storefront: tokens centralizados, layout y componentes UI listos
              para conectar catálogo y APIs en los siguientes cambios OpenSpec.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href="/search">Ir al buscador (demo)</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/cuenta">Área de cliente</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Design tokens",
              body: "Colores y tipografía solo en globals.css",
            },
            {
              title: "Monorepo",
              body: "storefront :3000 · cms :3001",
            },
            {
              title: "Roadmap",
              body: "43 cambios en openspec/ROADMAP.md",
            },
          ].map((item) => (
            <Card key={item.title} className="p-5">
              <h2 className="font-bold text-text">{item.title}</h2>
              <p className="mt-2 text-sm text-text-secondary">{item.body}</p>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-text-tertiary">
          Prototipo histórico:{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
            especificaciones_inicio/diseño/jeyjo-next
          </code>
        </p>
      </Container>
    </div>
  );
}
