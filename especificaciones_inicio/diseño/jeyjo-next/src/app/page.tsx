import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SearchBar } from "@/components/layout/SearchBar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import {
  ChevronRightIcon,
  LeafIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/icons";
import { CATEGORIES } from "@/lib/data/categories";
import { getBestsellers, getEcoProducts } from "@/lib/data/products";

function SectionHeader({
  title,
  subtitle,
  href,
  cta,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h2>
        {subtitle && <p className="mt-1 text-text-tertiary">{subtitle}</p>}
      </div>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-text-brand"
        >
          {cta} <ChevronRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const bestsellers = getBestsellers(5);
  const eco = getEcoProducts(4);

  return (
    <div className="animate-fade-up">
      {/* Hero */}
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
              Más de 30.000 referencias para particulares y empresas. Tarifas personalizadas, envío
              en 24-48 h y atención humana cuando la necesites.
            </p>
            <div className="mt-6 flex justify-center">
              <SearchBar />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Folios A4", "Tóner HP", "Bolígrafos BIC", "Calculadora Casio", "Pilas"].map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-border-strong"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Segments */}
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
                <Link href="/c/escritura">
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
                <Link href="/c/impresion">
                  Solicitar acceso B2B <ChevronRightIcon size={14} />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </Container>

      {/* Categories */}
      <Container className="pt-12">
        <SectionHeader title="Explora por categoría" subtitle="Lo que más se pide en nuestras tiendas." />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/c/${cat.id}`}
              className="flex flex-col items-center gap-2.5 rounded-lg border border-border bg-surface p-4 transition-transform hover:-translate-y-0.5 hover:border-border-strong"
            >
              <span className="grid h-16 w-16 place-items-center rounded-md bg-surface-subtle">
                <ProductGlyph kind={cat.glyph} size={42} />
              </span>
              <span className="text-center text-[13px] font-semibold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </Container>

      {/* Bestsellers */}
      <Container className="pt-14">
        <SectionHeader
          title="Top ventas esta semana"
          subtitle="Lo que más vendemos a particulares y empresas."
          href="/c/escritura"
          cta="Ver todos"
        />
        <ProductGrid products={bestsellers} className="mt-5" />
      </Container>

      {/* Eco */}
      <Container className="pt-14">
        <SectionHeader
          title="Reciclaje y sostenibilidad"
          subtitle="Material para una oficina más limpia y consciente."
          href="/c/reciclaje"
          cta="Explorar gama eco"
        />
        <ProductGrid products={eco} className="mt-5" />
      </Container>

      {/* Trust strip */}
      <Container className="pt-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <TruckIcon size={20} />, t: "Envío en 24-48 h", s: "Gratis desde 39 € (B2C) o 10 € (B2B)" },
            { icon: <SparklesIcon size={20} />, t: "EVA · IA 24/7", s: "Resuelve dudas y crea pedidos al instante" },
            { icon: <ShieldIcon size={20} />, t: "Pago seguro", s: "Redsys, Bizum, PayPal, Apple Pay" },
            { icon: <RefreshIcon size={20} />, t: "Devolución 14 días", s: "Gestión de RMA online" },
          ].map((b) => (
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
    </div>
  );
}
