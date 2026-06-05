"use client";

import { useCallback, useEffect, useState } from "react";

import type { EvaBootstrapResponse } from "@/lib/eva/types";

import "./eva-widget.css";

declare global {
  interface Window {
    __evaSkaiLoaded?: boolean;
    EvaSkai?: { open?: () => void };
  }
}

function readPageContextFromDom(): { productSku?: string; productName?: string } {
  const el = document.querySelector("[data-eva-product-sku]");
  if (!el) return {};
  return {
    productSku: el.getAttribute("data-eva-product-sku") ?? undefined,
    productName: el.getAttribute("data-eva-product-name") ?? undefined,
  };
}

type Props = {
  channel?: "storefront" | "intranet";
};

export function EvaWidgetLauncher({ channel = "storefront" }: Props) {
  const [bootstrap, setBootstrap] = useState<EvaBootstrapResponse | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const page = readPageContextFromDom();
    const params = new URLSearchParams({
      path: window.location.pathname,
      channel,
    });
    if (page.productSku) params.set("productSku", page.productSku);
    if (page.productName) params.set("productName", page.productName);

    const res = await fetch(`/api/eva/bootstrap?${params}`).catch(() => null);
    if (!res?.ok) {
      setError(true);
      return;
    }
    const body = (await res.json()) as EvaBootstrapResponse;
    if (!body.enabled) {
      setError(true);
      return;
    }
    setBootstrap(body);
    setError(false);
  }, [channel]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!bootstrap?.scriptUrl || window.__evaSkaiLoaded) return;
    const script = document.createElement("script");
    script.src = bootstrap.scriptUrl;
    script.async = true;
    script.dataset.widgetId = bootstrap.widgetId ?? "";
    script.dataset.contextToken = bootstrap.contextToken ?? "";
    script.onload = () => {
      window.__evaSkaiLoaded = true;
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [bootstrap]);

  const showFallback = error || !bootstrap?.enabled;

  if (showFallback) {
    const msg =
      bootstrap?.unavailableMessage ??
      "El asistente no está disponible en este momento; puedes contactar con nosotros por teléfono o email";
    const fb = bootstrap?.fallback;
    return (
      <div className="eva-widget">
        <button
          type="button"
          className="eva-widget__launcher"
          aria-label="Asistente EVA"
          onClick={() => setOpen((v) => !v)}
        >
          EVA
        </button>
        {open && (
          <div className="eva-widget__panel" role="dialog" aria-label="Contacto EVA">
            <p>{msg}</p>
            {fb?.phone && <p>Tel: {fb.phone}</p>}
            {fb?.email && <p>Email: {fb.email}</p>}
            {fb?.whatsapp && <p>WhatsApp: {fb.whatsapp}</p>}
            {fb?.businessHours && <p>Horario: {fb.businessHours}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="eva-widget">
      <button
        type="button"
        className="eva-widget__launcher"
        aria-label="Abrir asistente EVA"
        onClick={() => {
          if (window.EvaSkai?.open) {
            window.EvaSkai.open();
            return;
          }
          setOpen((v) => !v);
        }}
      >
        EVA
      </button>
      {open && (
        <div className="eva-widget__panel" role="dialog" aria-label="Asistente EVA">
          <p>Asistente EVA listo. {bootstrap?.scriptUrl ? "Widget SKAI cargado." : "Modo integración local."}</p>
          {bootstrap?.fallback.businessHours && (
            <p className="eva-widget__muted">Horario humano: {bootstrap.fallback.businessHours}</p>
          )}
        </div>
      )}
    </div>
  );
}
