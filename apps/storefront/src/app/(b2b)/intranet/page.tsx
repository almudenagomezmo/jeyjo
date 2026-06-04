import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Intranet" };

export default function IntranetDashboardPage() {
  return (
    <Card className="p-8">
      <h2 className="text-lg font-bold">Panel B2B</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Bienvenido al portal de empresa. Las secciones del menú estarán disponibles en próximas fases del
        proyecto.
      </p>
    </Card>
  );
}
