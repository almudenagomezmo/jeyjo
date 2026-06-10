"use client";

import { useState } from "react";
import type { CustomerAddress } from "@jeyjo/database-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AddressFormProps = {
  onCreated: (address?: CustomerAddress) => void;
  title?: string;
  showDefaultOption?: boolean;
  submitLabel?: string;
};

export function AddressForm({
  onCreated,
  title = "Nueva dirección",
  showDefaultOption = true,
  submitLabel = "Guardar dirección",
}: AddressFormProps) {
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label || null,
          recipient_name: recipientName || null,
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city,
          postal_code: postalCode,
          phone: phone || null,
          is_default: isDefault,
        }),
      });
      const body = (await res.json()) as { error?: string; address?: CustomerAddress };
      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo guardar");
      }
      setLabel("");
      setRecipientName("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setPostalCode("");
      setPhone("");
      setIsDefault(false);
      onCreated(body.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <Input placeholder="Etiqueta (ej. Almacén)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Input
        placeholder="Destinatario"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
      />
      <Input
        placeholder="Dirección *"
        required
        value={addressLine1}
        onChange={(e) => setAddressLine1(e.target.value)}
      />
      <Input
        placeholder="Piso, puerta…"
        value={addressLine2}
        onChange={(e) => setAddressLine2(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Ciudad *" required value={city} onChange={(e) => setCity(e.target.value)} />
        <Input
          placeholder="Código postal *"
          required
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </div>
      <Input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {showDefaultOption && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-border-subtle"
          />
          Marcar como predeterminada
        </label>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
