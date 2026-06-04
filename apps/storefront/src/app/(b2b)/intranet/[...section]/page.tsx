import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Intranet" };

export default function IntranetSectionPlaceholderPage() {
  return (
    <Card className="p-8 text-center text-text-secondary">
      <p className="font-semibold">Próximamente</p>
      <p className="mt-2 text-sm">Esta sección del portal B2B se implementará en un cambio posterior.</p>
    </Card>
  );
}
