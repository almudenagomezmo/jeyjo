import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { getCustomerContext } from "@/lib/auth/customer-context";
import { isB2bValidated } from "@/lib/auth/redirect";

const INTRANET_LINKS = [
  { href: "/intranet", label: "Mi cuenta" },
  { href: "/intranet/contabilidad", label: "Contabilidad" },
  { href: "/intranet/pedidos", label: "Histórico de pedidos" },
  { href: "/intranet/pedido-rapido", label: "Pedido rápido" },
  { href: "/intranet/precios", label: "Precios especiales" },
  { href: "/intranet/rma", label: "RMA" },
  { href: "/intranet/stock", label: "Avisos de stock" },
  { href: "/intranet/descargas", label: "Descargas" },
  { href: "/intranet/contacto", label: "Contacto" },
];

export default async function IntranetLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/intranet");
  if (!isB2bValidated(ctx)) redirect("/cuenta?error=forbidden");

  const showMfaBanner = ctx.role === "b2b_superadmin" && !ctx.mfaEnabled;

  return (
    <Container className="py-8">
      <header className="mb-6 border-b border-border-subtle pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Intranet B2B</p>
        <h1 className="mt-1 text-2xl font-extrabold">{ctx.commercialName}</h1>
        {ctx.taxId && <p className="text-sm text-text-secondary">CIF: {ctx.taxId}</p>}
      </header>

      {showMfaBanner && (
        <div className="mb-6 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          Recomendamos activar la autenticación en dos pasos (MFA) para proteger tu cuenta de empresa. La
          activación estará disponible en una próxima actualización.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-1 text-sm" aria-label="Menú intranet">
          {INTRANET_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 font-semibold text-text-secondary hover:bg-surface-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
