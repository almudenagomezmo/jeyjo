import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/account/LogoutButton";
import { PendingValidationBanner } from "@/components/account/PendingValidationBanner";
import { ProfileDisplayNameForm } from "@/components/account/ProfileDisplayNameForm";
import { Card } from "@/components/ui/Card";
import { getCustomerContext } from "@/lib/auth/customer-context";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Perfil" };

export default async function AccountProfilePage() {
  const ctx = await getCustomerContext();
  if (!ctx) redirect("/login?next=/cuenta/perfil");

  const address = [
    ctx.billingAddressLine1,
    [ctx.billingPostalCode, ctx.billingCity].filter(Boolean).join(" "),
    ctx.billingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>
        <LogoutButton />
      </div>
      {!ctx.validatedAt && <PendingValidationBanner />}
      <Card className="p-6">
        <ProfileDisplayNameForm initialDisplayName={ctx.displayName} />
      </Card>
      <Card className="p-6">
        <p className="text-sm text-text-secondary">
          Los demás datos de registro son de solo lectura. Para cambiar la contraseña usa el enlace de
          recuperación de Supabase Auth.
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-text-tertiary">Nombre comercial</dt>
            <dd className="font-semibold">{ctx.commercialName}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">Email</dt>
            <dd className="font-semibold">{ctx.email}</dd>
          </div>
          {ctx.taxId && (
            <div>
              <dt className="text-text-tertiary">CIF / NIF</dt>
              <dd className="font-semibold">{ctx.taxId}</dd>
            </div>
          )}
          {address && (
            <div>
              <dt className="text-text-tertiary">Dirección de facturación</dt>
              <dd className="font-semibold">{address}</dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  );
}
