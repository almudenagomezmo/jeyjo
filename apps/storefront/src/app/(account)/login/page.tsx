import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <Container className="py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
