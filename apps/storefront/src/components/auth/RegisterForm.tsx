"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function RegisterForm() {
  const router = useRouter();
  const [isCompany, setIsCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      commercialName: String(fd.get("commercialName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      isCompany,
      taxId: String(fd.get("taxId") ?? ""),
      billingAddressLine1: String(fd.get("billingAddressLine1") ?? ""),
      billingCity: String(fd.get("billingCity") ?? ""),
      billingPostalCode: String(fd.get("billingPostalCode") ?? ""),
      billingCountry: String(fd.get("billingCountry") ?? "ES"),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string
        details?: string
        message?: string
        needsEmailConfirmation?: boolean
      };
      if (!res.ok) {
        setError(
          data.details
            ? `${data.error ?? "Error"}: ${data.details}`
            : (data.error ?? "No se pudo completar el registro"),
        );
        return;
      }
      const needsConfirm = data.needsEmailConfirmation === true;
      setInfo(
        data.message ??
          (needsConfirm
            ? "Revisa tu email para confirmar la cuenta antes de iniciar sesión."
            : "Registro completado. Pendiente de validación por Jeyjo."),
      );
      if (!needsConfirm) {
        router.push("/login");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Crear cuenta</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Tras el registro, un administrador validará tu cuenta. Hasta entonces comprarás con condiciones de
        particular.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          Nombre o razón social
          <Input className="mt-1" name="commercialName" required />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            className="rounded border-border"
          />
          Soy empresa
        </label>
        {isCompany && (
          <label className="block text-sm font-semibold">
            CIF / NIF
            <Input className="mt-1" name="taxId" required={isCompany} />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Email
          <Input className="mt-1" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block text-sm font-semibold">
          Contraseña
          <Input className="mt-1" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        <label className="block text-sm font-semibold">
          Teléfono
          <Input className="mt-1" name="phone" type="tel" required />
        </label>
        <fieldset className="space-y-3 rounded-md border border-border-subtle p-4">
          <legend className="px-1 text-sm font-semibold">Dirección de facturación</legend>
          <label className="block text-sm font-semibold">
            Calle y número
            <Input className="mt-1" name="billingAddressLine1" required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Ciudad
              <Input className="mt-1" name="billingCity" required />
            </label>
            <label className="block text-sm font-semibold">
              C.P.
              <Input className="mt-1" name="billingPostalCode" required />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            País (ISO)
            <Input className="mt-1" name="billingCountry" defaultValue="ES" maxLength={2} required />
          </label>
        </fieldset>
        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-text-secondary">{info}</p>}
        <Button type="submit" block disabled={loading}>
          {loading ? "Registrando…" : "Registrarse"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
