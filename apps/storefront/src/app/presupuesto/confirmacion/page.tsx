import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Presupuesto solicitado" };

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function PresupuestoConfirmacionPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const quoteNumber = ref?.trim();

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Solicitud recibida</h1>
        {quoteNumber ? (
          <>
            <p className="mt-4 text-text-secondary">
              Tu presupuesto ha sido registrado con el número:
            </p>
            <p className="mt-2 text-3xl font-extrabold tabular text-text-brand">{quoteNumber}</p>
            <p className="mt-4 text-sm text-text-secondary">
              Te hemos enviado un email de confirmación. Nuestro equipo revisará tu solicitud y te
              contactará con el presupuesto formal.
            </p>
          </>
        ) : (
          <p className="mt-4 text-text-secondary">
            Tu solicitud de presupuesto ha sido registrada correctamente.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Seguir comprando</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/cuenta/presupuestos">Mis presupuestos</Link>
          </Button>
        </div>
      </Card>
    </Container>
  );
}
