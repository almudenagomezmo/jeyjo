import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Registro" };

export default function RegisterPage() {
  return (
    <Container className="py-12">
      <RegisterForm />
    </Container>
  );
}
