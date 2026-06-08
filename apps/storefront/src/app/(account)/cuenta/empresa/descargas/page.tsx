import type { Metadata } from "next";

import { CatalogDownloadsView } from "@/components/intranet/CatalogDownloadsView";
import { getCustomerContext, pricingCustomerGroup } from "@/lib/auth/customer-context";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";
import { fetchB2bCatalogDownloads } from "@/lib/intranet/catalog-downloads/fetch-catalog-downloads";

const PATH = "/cuenta/empresa/descargas";

export const metadata: Metadata = {
  title: "Descargas",
  description: "Catálogos, fichas técnicas y documentación comercial descargable.",
};

export default async function DescargasPage() {
  await guardEmpresaPage(PATH);
  const ctx = await getCustomerContext();
  const items = await fetchB2bCatalogDownloads({
    customerGroup: pricingCustomerGroup(ctx),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Descargas</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Catálogos PDF y revistas de ofertas vigentes para tu grupo de cliente.
        </p>
      </div>
      <CatalogDownloadsView items={items} />
    </div>
  );
}
