import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DOCUMENT_TYPE_SECTION_LABELS,
  groupCatalogDownloadsByType,
} from "@/lib/intranet/catalog-downloads/group-by-type";
import type { CatalogDownloadDto } from "@/lib/intranet/catalog-downloads/types";

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function CatalogDownloadCard({ item }: { item: CatalogDownloadDto }) {
  return (
    <Card className="flex h-full flex-col gap-4 p-4">
      <div className="flex gap-4">
        {item.coverImageUrl ? (
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
            <Image
              src={item.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div
            className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-semibold text-text-secondary"
            aria-hidden
          >
            PDF
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary">{item.title}</h3>
          {item.description ? (
            <p className="mt-1 line-clamp-3 text-sm text-text-secondary">{item.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-text-secondary">
            Vigente hasta {formatDate(item.validUntil)}
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" className="mt-auto w-full sm:w-auto">
        <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
          Descargar PDF
        </a>
      </Button>
    </Card>
  );
}

export function CatalogDownloadsView({ items }: { items: CatalogDownloadDto[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-text-secondary">
          No hay catálogos ni revistas de ofertas vigentes en este momento.
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          Consulta el{" "}
          <Link href="/" className="font-medium text-brand-primary underline-offset-2 hover:underline">
            catálogo público
          </Link>{" "}
          o contacta con tu comercial si necesitas documentación adicional.
        </p>
      </Card>
    );
  }

  const grouped = groupCatalogDownloadsByType(items);

  return (
    <div className="space-y-8">
      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((type) => {
        const sectionItems = grouped[type];
        if (sectionItems.length === 0) return null;
        return (
          <section key={type} className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary">
              {DOCUMENT_TYPE_SECTION_LABELS[type]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {sectionItems.map((item) => (
                <CatalogDownloadCard key={String(item.id)} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
