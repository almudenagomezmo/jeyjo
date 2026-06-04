"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmed = searchParams.get("confirmed") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          next: searchParams.get("next"),
        }),
      });
      const data = (await res.json()) as { error?: string; redirectTo?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }
      router.push(data.redirectTo ?? "/cuenta");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Iniciar sesión</h1>
      {confirmed && (
        <p className="mt-2 text-sm text-text-secondary">
          Email confirmado. Ya puedes acceder con tu contraseña.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          Email
          <Input
            className="mt-1"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Contraseña
          <Input
            className="mt-1"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" block disabled={loading}>
          {loading ? "Accediendo…" : "Acceder"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-text-brand hover:underline">
          Regístrate
        </Link>
      </p>
    </Card>
  );
}
