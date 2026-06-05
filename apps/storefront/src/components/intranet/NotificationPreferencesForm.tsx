"use client";

import { useEffect, useState } from "react";

import type { NotificationChannel, NotificationPreferences } from "@/lib/notifications/types";

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Email y portal" },
  { value: "portal", label: "Solo portal" },
  { value: "off", label: "Desactivado" },
];

type CategoryKey = "invoiceChannel" | "orderChannel" | "quoteChannel";

const CATEGORIES: { key: CategoryKey; label: string; description: string }[] = [
  {
    key: "invoiceChannel",
    label: "Facturas",
    description: "Cuando hay una nueva factura disponible en el portal",
  },
  {
    key: "orderChannel",
    label: "Pedidos",
    description: "Cambios de estado en tus pedidos web",
  },
  {
    key: "quoteChannel",
    label: "Presupuestos",
    description: "Actualizaciones y avisos de caducidad de presupuestos",
  },
];

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/intranet/notification-preferences");
      if (res.ok) setPrefs(await res.json());
    })();
  }, []);

  async function save(next: NotificationPreferences) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/intranet/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceChannel: next.invoiceChannel,
          orderChannel: next.orderChannel,
          quoteChannel: next.quoteChannel,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "No se pudieron guardar las preferencias");
        return;
      }
      setPrefs(await res.json());
      setMessage("Preferencias guardadas");
    } finally {
      setSaving(false);
    }
  }

  function updateChannel(key: CategoryKey, value: NotificationChannel) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void save(next);
  }

  if (!prefs) {
    return <p className="text-sm text-text-secondary">Cargando preferencias…</p>;
  }

  return (
    <div className="space-y-6">
      {prefs.emailDisabledAt && (
        <p className="rounded-md border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-secondary">
          El envío por email está desactivado para tu cuenta por un error de entrega permanente.
          Seguirás recibiendo avisos en el portal si los tienes activos.
        </p>
      )}

      <p className="text-sm text-text-secondary">
        Elige cómo quieres recibir cada tipo de aviso. La campana del portal siempre refleja las
        notificaciones activas en el canal portal.
      </p>

      <div className="space-y-5">
        {CATEGORIES.map((cat) => (
          <fieldset key={cat.key} className="space-y-2">
            <legend className="text-sm font-semibold text-text-primary">{cat.label}</legend>
            <p className="text-xs text-text-tertiary">{cat.description}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {CHANNEL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm has-[:checked]:border-text-primary has-[:checked]:bg-surface-muted"
                >
                  <input
                    type="radio"
                    name={cat.key}
                    value={opt.value}
                    checked={prefs[cat.key] === opt.value}
                    disabled={saving}
                    onChange={() => updateChannel(cat.key, opt.value)}
                    className="accent-[var(--text)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {message && <p className="text-sm font-semibold text-green-700 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}
