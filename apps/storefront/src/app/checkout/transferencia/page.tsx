import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPaymentSettings } from "@/lib/payments/settings";
import { findPayloadOrderByNumber } from "@/lib/payments/payload-orders";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function TransferenciaPage({ searchParams }: PageProps) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber?.trim()) notFound();

  const order = await findPayloadOrderByNumber(orderNumber.trim());
  if (!order) notFound();

  const settings = await fetchPaymentSettings();
  const { iban, beneficiary, conceptTemplate } = settings.transferInstructions;
  const concept = (conceptTemplate ?? "Pedido {orderNumber}").replace(
    "{orderNumber}",
    order.orderNumber ?? orderNumber,
  );

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-lg space-y-4 p-10">
        <h1 className="text-2xl font-extrabold">Transferencia bancaria</h1>
        <p className="text-text-secondary">
          Pedido <strong>{order.orderNumber}</strong> registrado. Realiza la transferencia con estos
          datos:
        </p>
        <dl className="space-y-2 text-sm">
          {beneficiary && (
            <>
              <dt className="font-semibold text-text-secondary">Beneficiario</dt>
              <dd>{beneficiary}</dd>
            </>
          )}
          {iban && (
            <>
              <dt className="font-semibold text-text-secondary">IBAN</dt>
              <dd className="font-mono">{iban}</dd>
            </>
          )}
          <dt className="font-semibold text-text-secondary">Concepto</dt>
          <dd>{concept}</dd>
        </dl>
        <p className="text-xs text-text-tertiary">
          El pedido permanece pendiente de pago hasta confirmación manual por nuestro equipo.
        </p>
        <Button size="lg" asChild>
          <Link href={`/checkout/confirmacion?order=${encodeURIComponent(order.orderNumber ?? orderNumber)}`}>
            Ver resumen del pedido
          </Link>
        </Button>
      </Card>
    </Container>
  );
}
