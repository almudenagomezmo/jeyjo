import { redirect } from "next/navigation";

export default function ContabilidadIndexPage() {
  redirect("/cuenta/empresa/contabilidad/facturas");
}
