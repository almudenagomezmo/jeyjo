import type { Metadata } from "next";
import { Form347Panel } from "@/components/intranet/contabilidad/Form347Panel";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Cifra 347" };

export default async function Cifra347Page() {
  await guardEmpresaPage("/cuenta/empresa/contabilidad/cifra-347");
  return <Form347Panel />;
}
