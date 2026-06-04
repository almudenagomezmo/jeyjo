import { Container } from "@/components/layout/Container";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
