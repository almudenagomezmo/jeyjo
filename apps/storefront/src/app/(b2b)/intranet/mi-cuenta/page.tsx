import type { Metadata } from "next";

import { NotificationPreferencesForm } from "@/components/intranet/NotificationPreferencesForm";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function MiCuentaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-text-primary">Mi cuenta</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configura cómo quieres recibir avisos del portal y por email.
        </p>
      </div>
      <NotificationPreferencesForm />
    </div>
  );
}
