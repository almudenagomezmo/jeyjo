"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaymentMethodCode } from "@/lib/payments/settings";
import { cn } from "@/lib/utils/cn";
import { PaymentMethodBrandIcon } from "@/components/checkout/PaymentMethodBrandIcon";

export type PaymentMethodOption = {
  code: string;
  label: string;
};

type PaymentMethodSelectorProps = {
  methods: PaymentMethodOption[];
  value: string;
  onChange: (code: string) => void;
  applePayEnabled?: boolean;
  googlePayEnabled?: boolean;
  disabled?: boolean;
};

const PAYMENT_META: Record<
  PaymentMethodCode,
  { title: string; description: string }
> = {
  card: {
    title: "Tarjeta de crédito o débito",
    description: "Pago seguro con Visa, Mastercard y otras tarjetas",
  },
  bizum: {
    title: "Bizum",
    description: "Pago instantáneo desde la app de tu banco",
  },
  paypal: {
    title: "PayPal",
    description: "Paga con tu cuenta PayPal o tarjeta vinculada",
  },
  apple_pay: {
    title: "Apple Pay",
    description: "Pago rápido con Face ID o Touch ID",
  },
  google_pay: {
    title: "Google Pay",
    description: "Pago rápido con tu dispositivo Android",
  },
  transfer: {
    title: "Transferencia bancaria",
    description: "Recibirás las instrucciones al confirmar el pedido",
  },
};

const DISPLAY_ORDER: PaymentMethodCode[] = [
  "card",
  "bizum",
  "paypal",
  "apple_pay",
  "google_pay",
  "transfer",
];

function useWalletAvailability(applePayEnabled?: boolean, googlePayEnabled?: boolean) {
  const [available, setAvailable] = useState({ applePay: false, googlePay: false });

  useEffect(() => {
    const appleAvailable =
      Boolean(applePayEnabled) &&
      "ApplePaySession" in window &&
      // @ts-expect-error ApplePaySession is browser-specific
      window.ApplePaySession?.canMakePayments?.();

    const googleAvailable = Boolean(googlePayEnabled) && "PaymentRequest" in window;

    setAvailable({ applePay: appleAvailable, googlePay: googleAvailable });
  }, [applePayEnabled, googlePayEnabled]);

  return available;
}

function sortMethods(methods: PaymentMethodOption[]): PaymentMethodOption[] {
  return [...methods].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.code as PaymentMethodCode);
    const bi = DISPLAY_ORDER.indexOf(b.code as PaymentMethodCode);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function getMeta(method: PaymentMethodOption) {
  const known = PAYMENT_META[method.code as PaymentMethodCode];
  if (known) return known;
  return { title: method.label, description: "Método de pago disponible" };
}

export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  applePayEnabled,
  googlePayEnabled,
  disabled,
}: PaymentMethodSelectorProps) {
  const walletAvailability = useWalletAvailability(applePayEnabled, googlePayEnabled);

  const visibleMethods = useMemo(() => {
    const filtered = methods.filter((method) => {
      if (method.code === "apple_pay") return walletAvailability.applePay;
      if (method.code === "google_pay") return walletAvailability.googlePay;
      return true;
    });
    return sortMethods(filtered);
  }, [methods, walletAvailability.applePay, walletAvailability.googlePay]);

  if (visibleMethods.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-extrabold">Forma de pago</h2>
        <p className="mt-4 rounded-md border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          No hay formas de pago disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold">Forma de pago</h2>
        <p className="mt-1 text-sm text-text-secondary">Elige cómo quieres pagar tu pedido</p>
      </div>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="sr-only">Forma de pago</legend>

        <div className="space-y-2" role="radiogroup" aria-label="Forma de pago">
          {visibleMethods.map((method) => {
            const meta = getMeta(method);
            const selected = value === method.code;

            return (
              <label
                key={method.code}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                  selected
                    ? "border-primary bg-primary-soft ring-1 ring-primary/20"
                    : "border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-hover",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.code}
                  checked={selected}
                  onChange={() => onChange(method.code)}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text">{meta.title}</span>
                  <span className="mt-0.5 block text-xs text-text-tertiary">{meta.description}</span>
                </span>
                <PaymentMethodBrandIcon code={method.code} className="shrink-0 self-center" />
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="flex items-center gap-1.5 text-xs text-success-text">
        <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
          <path
            fill="currentColor"
            d="M8 1a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v1h2V4a1 1 0 0 0-1-1Z"
          />
        </svg>
        Conexión segura. Tus datos de pago se procesan en la pasarela del proveedor.
      </p>
    </div>
  );
}
