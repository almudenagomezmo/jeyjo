import type { Metadata } from "next";
import { Form347Panel } from "@/components/intranet/contabilidad/Form347Panel";
import { guardIntranetPage } from "@/lib/b2b/guard-page";

export const metadata: Metadata = { title: "Cifra 347" };

export default async function Cifra347Page() {
  await guardIntranetPage("/intranet/contabilidad/cifra-347");
  return <Form347Panel />;
}
