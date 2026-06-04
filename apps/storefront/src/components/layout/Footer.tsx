import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/ui/Logo";
import type { NavNode } from "@/lib/catalog/fetch-navigation-tree";

interface FooterProps {
  tree: NavNode[];
}

const staticColumns = [
  {
    title: "Comprar en Jeyjo",
    links: [
      { label: "Envíos y plazos", href: "#" },
      { label: "Devoluciones y RMA", href: "#" },
      { label: "Formas de pago", href: "#" },
      { label: "Empresas B2B", href: "#" },
      { label: "Solicitar presupuesto", href: "#" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Centro de ayuda", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Mi cuenta", href: "/cuenta" },
      { label: "Buscar", href: "/search" },
      { label: "Seguimiento de pedido", href: "#" },
      { label: "Privacidad y cookies", href: "#" },
    ],
  },
] as const;

export function Footer({ tree }: FooterProps) {
  const catalogLinks = tree.map((cat) => ({ label: cat.title, href: `/c/${cat.slug}` }));

  const columns = [{ title: "Catálogo", links: catalogLinks }, ...staticColumns];

  return (
    <footer className="mt-20 bg-ink pt-14 text-neutral-200">
      <Container>
        <div className="grid grid-cols-2 gap-10 pb-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="col-span-2 md:col-span-1">
            <Logo size={32} color="white" />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-neutral-300">
              Material de oficina y reciclaje desde 1998. Servicio para particulares y empresas en
              toda España.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3.5 text-[13px] font-bold text-white">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-neutral-300 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 py-5 text-[12px] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Jeyjo Material de Oficina, SL · CIF B-26000000</span>
          <span>Visa · MasterCard · Bizum · PayPal · Apple Pay · Google Pay</span>
        </div>
      </Container>
    </footer>
  );
}
