import type { Metadata } from "next";
import { IntranetScaffoldPage } from "@/components/intranet/IntranetScaffoldPage";
import { getScaffoldForPath } from "@/lib/intranet/navigation";
import { guardEmpresaPage } from "@/lib/b2b/guard-page";

const PATH = "/cuenta/empresa/contacto";
const scaffold = getScaffoldForPath(PATH)!;

export const metadata: Metadata = { title: scaffold.title };

export default async function ContactoPage() {
  await guardEmpresaPage(PATH);
  return <IntranetScaffoldPage pathname={PATH} />;
}
