"use client";

import { useCallback, useEffect, useState } from "react";

import type { B2bPermissions } from "@/lib/b2b/permissions";
import { DEFAULT_SUBUSER_PERMISSIONS } from "@/lib/b2b/permissions";
import type { SubuserRow } from "@/lib/intranet/subusers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SubuserFormState = {
  displayName: string;
  email: string;
  password: string;
  permissions: B2bPermissions;
};

const emptyForm = (): SubuserFormState => ({
  displayName: "",
  email: "",
  password: "",
  permissions: { ...DEFAULT_SUBUSER_PERMISSIONS },
});

function PermissionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border-subtle px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SubusersPanel() {
  const [subusers, setSubusers] = useState<SubuserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubuserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intranet/subusers");
      if (!res.ok) throw new Error("No se pudo cargar la lista de usuarios");
      const data = (await res.json()) as { subusers: SubuserRow[] };
      setSubusers(data.subusers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(row: SubuserRow) {
    setEditingId(row.id);
    setForm({
      displayName: row.displayName ?? "",
      email: row.email,
      password: "",
      permissions: { ...row.permissions },
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/intranet/subusers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: form.displayName,
            permissions: form.permissions,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Error al guardar");
        }
      } else {
        const res = await fetch("/api/intranet/subusers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Error al crear");
        }
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: SubuserRow) {
    setError(null);
    const res = await fetch(`/api/intranet/subusers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "No se pudo actualizar el estado");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Usuarios de la empresa</h2>
          <p className="text-sm text-text-secondary">
            Crea subusuarios con permisos por sección y aprobación opcional de pedidos.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Nuevo subusuario
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary">Cargando usuarios…</p>
      ) : subusers.length === 0 ? (
        <Card className="p-6 text-sm text-text-secondary">Aún no hay subusuarios registrados.</Card>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border-subtle">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Permisos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subusers.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-semibold">{row.displayName ?? "—"}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {[
                      row.permissions.finance && "Finanzas",
                      row.permissions.orders && "Pedidos",
                      row.permissions.account && "Cuenta",
                      row.permissions.ordersRequireApproval && "Aprobación",
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">{row.isActive ? "Activo" : "Desactivado"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(row)}>
                        Editar
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => toggleActive(row)}>
                        {row.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Card className="p-6">
          <h3 className="text-base font-bold">{editingId ? "Editar subusuario" : "Nuevo subusuario"}</h3>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="font-semibold">Nombre</span>
              <input
                className="mt-1 w-full rounded-md border border-border px-3 py-2"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
            </label>
            {!editingId && (
              <label className="block text-sm">
                <span className="font-semibold">Email</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="font-semibold">
                {editingId ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
              </span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-border px-3 py-2"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editingId}
                minLength={8}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <PermissionToggle
                label="Contabilidad / finanzas"
                checked={form.permissions.finance}
                onChange={(finance) => setForm((f) => ({ ...f, permissions: { ...f.permissions, finance } }))}
              />
              <PermissionToggle
                label="Pedidos y operaciones"
                checked={form.permissions.orders}
                onChange={(orders) => setForm((f) => ({ ...f, permissions: { ...f.permissions, orders } }))}
              />
              <PermissionToggle
                label="Datos de cuenta"
                checked={form.permissions.account}
                onChange={(account) => setForm((f) => ({ ...f, permissions: { ...f.permissions, account } }))}
              />
              <PermissionToggle
                label="Pedidos requieren aprobación"
                checked={form.permissions.ordersRequireApproval}
                onChange={(ordersRequireApproval) =>
                  setForm((f) => ({ ...f, permissions: { ...f.permissions, ordersRequireApproval } }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
