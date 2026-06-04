import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type PortalSectionScaffoldProps = {
  title: string;
  description: string;
  roadmapRef: string;
};

export function PortalSectionScaffold({ title, description, roadmapRef }: PortalSectionScaffoldProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <Badge tone="neutral">Próximamente</Badge>
      </div>
      <p className="mt-3 text-sm text-text-secondary">{description}</p>
      <p className="mt-4 text-xs text-text-tertiary">Roadmap: {roadmapRef}</p>
    </Card>
  );
}
