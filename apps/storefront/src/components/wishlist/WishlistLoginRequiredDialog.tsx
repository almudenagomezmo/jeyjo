"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useWishlistSession } from "@/lib/wishlist/session-context";

export function WishlistLoginRequiredDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { loginModalOpen, closeLoginModal } = useWishlistSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (loginModalOpen && !el.open) {
      el.showModal();
    } else if (!loginModalOpen && el.open) {
      el.close();
    }
  }, [loginModalOpen]);

  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[200] m-0 w-[min(calc(100%-2rem),24rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40"
      onClose={closeLoginModal}
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold leading-snug">Inicia sesión para guardar favoritos</h2>
          <button
            type="button"
            onClick={closeLoginModal}
            className="text-sm font-semibold text-text-tertiary hover:text-text"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          Necesitas una cuenta para añadir productos a tu lista de favoritos y sincronizarlos entre
          dispositivos.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" asChild>
            <Link href={loginHref} onClick={closeLoginModal}>
              Iniciar sesión
            </Link>
          </Button>
          <Button variant="secondary" className="flex-1" onClick={closeLoginModal}>
            Cerrar
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
