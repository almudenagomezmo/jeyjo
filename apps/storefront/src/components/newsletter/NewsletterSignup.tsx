"use client";

import Link from "next/link";
import { useState } from "react";

import { Input } from "@/components/ui/Input";
import type { NewsletterSettings } from "@/lib/newsletter/types";

type NewsletterSignupProps = {
  settings: NewsletterSettings;
  defaultEmail?: string;
};

type FormState = "idle" | "submitting" | "success" | "error";

export function NewsletterSignup({ settings, defaultEmail = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!settings.enabled) {
    return (
      <div>
        <h3 className="mb-3.5 text-[13px] font-bold text-white">{settings.headline}</h3>
        <p className="text-[13px] text-neutral-400">Suscripciones temporalmente no disponibles.</p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consent) {
      setErrorMessage("Debes aceptar recibir comunicaciones comerciales.");
      setState("error");
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true, source: "footer" }),
      });
      const data = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) {
        setErrorMessage(data.error ?? "No se pudo completar la suscripción.");
        setState("error");
        return;
      }
      setState("success");
      setEmail("");
      setConsent(false);
    } catch {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      setState("error");
    }
  };

  return (
    <div>
      <h3 className="mb-3.5 text-[13px] font-bold text-white">{settings.headline}</h3>
      <p className="mb-4 max-w-sm text-[13px] leading-relaxed text-neutral-300">{settings.description}</p>

      {state === "success" ? (
        <p className="text-[13px] text-emerald-300">
          Revisa tu correo y confirma la suscripción desde el enlace que te hemos enviado.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/10 text-white placeholder:text-neutral-400"
          />
          <label className="flex items-start gap-2 text-[12px] leading-snug text-neutral-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Acepto recibir comunicaciones comerciales.{" "}
              <Link href={settings.privacyPolicyUrl} className="underline hover:text-white">
                Política de privacidad
              </Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex w-fit rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {state === "submitting" ? "Enviando…" : "Suscribirme"}
          </button>
          {state === "error" && errorMessage ? (
            <p className="text-[12px] text-red-300">{errorMessage}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}
