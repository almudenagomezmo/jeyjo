import { notFound } from "next/navigation";
import { PortalSectionScaffold } from "@/components/intranet/PortalSectionScaffold";
import { getScaffoldForPath } from "@/lib/intranet/navigation";

type IntranetScaffoldPageProps = {
  pathname: string;
};

export function IntranetScaffoldPage({ pathname }: IntranetScaffoldPageProps) {
  const scaffold = getScaffoldForPath(pathname);
  if (!scaffold) notFound();
  return <PortalSectionScaffold {...scaffold} />;
}
