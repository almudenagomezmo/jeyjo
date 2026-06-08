"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ProfileDisplayNameFormProps = {
  initialDisplayName: string | null;
};

export function ProfileDisplayNameForm({ initialDisplayName }: ProfileDisplayNameFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(initialDisplayName ?? "");
  }, [initialDisplayName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; displayName?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo guardar");
      }
      if (body.displayName) {
        setDisplayName(body.displayName);
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="display-name" className="text-sm font-semibold text-text">
          Nombre personal
        </label>
        <p className="mt-1 text-sm text-text-secondary">
          Se muestra en tus valoraciones de producto. No uses el nombre comercial de la empresa.
        </p>
      </div>
      <Input
        id="display-name"
        placeholder="Ej. Ana García"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={80}
        required
        minLength={2}
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      {success && (
        <p className="text-sm text-success">Nombre personal guardado correctamente.</p>
      )}
      <Button type="submit" disabled={saving || displayName.trim().length < 2}>
        {saving ? "Guardando…" : "Guardar nombre personal"}
      </Button>
    </form>
  );
}
