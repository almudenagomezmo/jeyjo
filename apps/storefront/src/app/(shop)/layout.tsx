import { CompareShell } from "@/components/compare/CompareShell";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CompareShell />
    </>
  );
}
