import type { Metadata } from "next";
import { IntranetScaffoldPage } from "@/components/intranet/IntranetScaffoldPage";
import { getScaffoldForPath } from "@/lib/intranet/navigation";

const PATH = "/intranet/contabilidad/presupuestos";
const scaffold = getScaffoldForPath(PATH)!;

export const metadata: Metadata = { title: scaffold.title };

export default function PresupuestosPage() {
  return <IntranetScaffoldPage pathname={PATH} />;
}
