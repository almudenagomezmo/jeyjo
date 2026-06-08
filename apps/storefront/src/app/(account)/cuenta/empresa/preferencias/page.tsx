import type { Metadata } from "next";

import { NotificationPreferencesForm } from "@/components/intranet/NotificationPreferencesForm";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Preferencias" };

export default async function PreferenciasPage() {
  await guardEmpresaPage("/cuenta/empresa/preferencias");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-text-primary">Preferencias</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configura cómo quieres recibir avisos del portal y por email.
        </p>
      </div>
      <NotificationPreferencesForm />
    </div>
  );
}
