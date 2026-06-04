import type { Metadata } from "next";
import { IntranetScaffoldPage } from "@/components/intranet/IntranetScaffoldPage";
import { getScaffoldForPath } from "@/lib/intranet/navigation";

const PATH = "/intranet/contabilidad/cifra-347";
const scaffold = getScaffoldForPath(PATH)!;

export const metadata: Metadata = { title: scaffold.title };

export default function Cifra347Page() {
  return <IntranetScaffoldPage pathname={PATH} />;
}
