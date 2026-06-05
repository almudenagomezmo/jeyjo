"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { BellIcon } from "@/components/ui/icons";
import type { NotificationItem } from "@/lib/notifications/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function NotificationBell({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intranet/notifications?limit=20");
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `web_profile_id=eq.${profileId}`,
        },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function markRead(ids: string[]) {
    await fetch("/api/intranet/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    void fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/intranet/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    void fetchNotifications();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-md text-text-primary hover:bg-surface-muted"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-border-subtle bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
            <span className="text-sm font-semibold text-text-primary">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Marcar todas
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {loading && items.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-text-tertiary">Cargando…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-text-tertiary">
                No tienes notificaciones
              </li>
            )}
            {items.map((item) => {
              const href =
                typeof item.payload.href === "string" ? item.payload.href : undefined;
              const content = (
                <>
                  <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                  {item.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{item.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-text-tertiary">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </>
              );
              return (
                <li
                  key={item.id}
                  className={
                    item.readAt
                      ? "border-b border-border-subtle last:border-0"
                      : "border-b border-border-subtle bg-surface-muted/50 last:border-0"
                  }
                >
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        if (!item.readAt) void markRead([item.id]);
                        setOpen(false);
                      }}
                      className="block px-3 py-2.5 hover:bg-surface-muted"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.readAt) void markRead([item.id]);
                      }}
                      className="block w-full px-3 py-2.5 text-left hover:bg-surface-muted"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
