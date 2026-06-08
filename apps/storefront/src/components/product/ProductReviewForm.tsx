"use client";

import Link from "next/link";
import { useState } from "react";

import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { ProductReviewMine } from "@/lib/reviews/types";

type Props = {
  productSlug: string;
  isLoggedIn: boolean;
  displayName: string | null;
  canReview: boolean;
  customerReview: ProductReviewMine | null;
};

export function ProductReviewForm({
  productSlug,
  isLoggedIn,
  displayName,
  canReview,
  customerReview,
}: Props) {
  const [rating, setRating] = useState(customerReview?.rating ?? 0);
  const [comment, setComment] = useState(customerReview?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-text-secondary">
        <p>Inicia sesión para dejar tu valoración.</p>
        <Link
          href={`/login?next=/p/${encodeURIComponent(productSlug)}`}
          className="mt-2 inline-block font-semibold text-primary hover:underline"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (!displayName?.trim()) {
    return (
      <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-text-secondary">
        <p>Completa tu nombre personal en el perfil para poder valorar productos.</p>
        <Link href="/cuenta/perfil" className="mt-2 inline-block font-semibold text-primary hover:underline">
          Ir a mi perfil
        </Link>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-text-secondary">
        Solo los clientes que han comprado este producto pueden dejar una valoración.
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    const method = customerReview ? "PATCH" : "POST";
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "No se pudo enviar la valoración");
        return;
      }
      setMessage(
        "Tu valoración se ha enviado y quedará visible cuando el equipo la apruebe.",
      );
    } catch {
      setError("Error de red al enviar la valoración");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      {customerReview?.status === "pending" && (
        <p className="text-sm text-warning">
          Tu valoración está pendiente de aprobación. Puedes editarla y volver a enviarla.
        </p>
      )}
      {customerReview?.status === "rejected" && (
        <p className="text-sm text-danger">
          Tu valoración fue rechazada. Puedes editarla y volver a enviarla para revisión.
        </p>
      )}
      {customerReview?.status === "approved" && (
        <p className="text-sm text-text-secondary">
          Ya has valorado este producto. Si la editas, volverá a revisión antes de publicarse.
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-text">Tu valoración</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} estrellas`}
              onClick={() => setRating(i)}
              className="p-0.5"
            >
              <StarIcon
                size={22}
                className={cn(i <= rating ? "text-warning" : "text-border-strong")}
                fill={i <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-text">
          Comentario
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Cuéntanos tu experiencia con el producto (mín. 10 caracteres)"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <button
        type="button"
        disabled={busy || rating < 1 || comment.trim().length < 10}
        onClick={() => void submit()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Enviando…" : customerReview ? "Actualizar valoración" : "Enviar valoración"}
      </button>
    </div>
  );
}
