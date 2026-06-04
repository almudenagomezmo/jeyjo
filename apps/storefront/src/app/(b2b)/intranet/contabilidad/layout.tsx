import { IntranetSubNav } from "@/components/intranet/IntranetSubNav";

export default function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntranetSubNav />
      {children}
    </>
  );
}
