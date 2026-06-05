"use client";

import { useCallback, useEffect, useState } from "react";

import type { EvaBootstrapResponse } from "@/lib/eva/types";
import { ChevronRightIcon, CloseIcon, SparklesIcon } from "@/components/ui/icons";

import "./eva-widget.css";

declare global {
  interface Window {
    __evaSkaiLoaded?: boolean;
    EvaSkai?: { open?: () => void };
  }
}

const SUGGESTIONS = [
  "¿Buscas un tóner HP?",
  "Estado de mi pedido",
  "Plazos de envío",
] as const;

const GREETING = [
  "¡Hola! Soy EVA, tu asistente de Jeyjo. ¿En qué puedo ayudarte hoy?",
  "Puedo recomendarte productos, comprobar stock o ayudarte con un pedido.",
] as const;

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

function EvaLauncherButton({
  onClick,
  label = "Pregúntale a EVA",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button type="button" className="eva-widget__launcher" onClick={onClick} aria-label={label}>
      <span className="eva-widget__launcher-icon">
        <SparklesIcon size={18} strokeWidth={2} />
      </span>
      {label}
    </button>
  );
}

function EvaPanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="eva-widget__header">
      <span className="eva-widget__avatar">
        <SparklesIcon size={18} strokeWidth={2} />
      </span>
      <div className="eva-widget__header-copy">
        <strong>EVA</strong>
        <span>powered by SKAI · online ahora</span>
      </div>
      <button type="button" className="eva-widget__close" onClick={onClose} aria-label="Cerrar">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

export function EvaWidgetLauncher({ channel = "storefront" }: Props) {
  const [bootstrap, setBootstrap] = useState<EvaBootstrapResponse | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

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

  const toggleOpen = () => setOpen((value) => !value);
  const close = () => setOpen(false);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, trimmed]);
    setDraft("");
    if (window.EvaSkai?.open) {
      window.EvaSkai.open();
    }
  };

  const showFallback = error || !bootstrap?.enabled;

  if (showFallback) {
    const msg =
      bootstrap?.unavailableMessage ??
      "El asistente no está disponible en este momento; puedes contactar con nosotros por teléfono o email";
    const fb = bootstrap?.fallback;

    return (
      <div className="eva-widget">
        <EvaLauncherButton onClick={toggleOpen} label="Asistente EVA" />
        {open && (
          <div className="eva-widget__panel" role="dialog" aria-label="Contacto EVA">
            <EvaPanelHeader onClose={close} />
            <div className="eva-widget__fallback">
              <p>{msg}</p>
              {fb?.phone && <p>Tel: {fb.phone}</p>}
              {fb?.email && <p>Email: {fb.email}</p>}
              {fb?.whatsapp && <p>WhatsApp: {fb.whatsapp}</p>}
              {fb?.businessHours && <p>Horario: {fb.businessHours}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="eva-widget">
      <EvaLauncherButton
        onClick={() => {
          if (window.EvaSkai?.open && !open) {
            window.EvaSkai.open();
          }
          toggleOpen();
        }}
      />
      {open && (
        <div className="eva-widget__panel" role="dialog" aria-label="Asistente EVA">
          <EvaPanelHeader onClose={close} />

          <div className="eva-widget__messages">
            {GREETING.map((line) => (
              <div key={line} className="eva-widget__bubble eva-widget__bubble--bot">
                {line}
              </div>
            ))}
            {messages.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="eva-widget__bubble eva-widget__bubble--user"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="eva-widget__chips">
            {SUGGESTIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="eva-widget__chip"
                onClick={() => sendMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="eva-widget__footer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(draft);
            }}
          >
            <input
              className="eva-widget__input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe tu pregunta..."
              aria-label="Escribe tu pregunta"
            />
            <button
              type="submit"
              className="eva-widget__send"
              disabled={!draft.trim()}
              aria-label="Enviar"
            >
              <ChevronRightIcon size={18} strokeWidth={2.2} />
            </button>
          </form>

          {bootstrap?.fallback.businessHours && (
            <p className="eva-widget__muted px-4 pb-4">
              Horario humano: {bootstrap.fallback.businessHours}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
