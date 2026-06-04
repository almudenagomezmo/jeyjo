"use client";

import { Button } from "@/components/ui/Button";

type WalletPayButtonsProps = {
  applePayEnabled: boolean;
  googlePayEnabled: boolean;
  onApplePay: () => void;
  onGooglePay: () => void;
  disabled?: boolean;
};

export function WalletPayButtons({
  applePayEnabled,
  googlePayEnabled,
  onApplePay,
  onGooglePay,
  disabled,
}: WalletPayButtonsProps) {
  const appleAvailable =
    applePayEnabled &&
    typeof window !== "undefined" &&
    "ApplePaySession" in window &&
    // @ts-expect-error ApplePaySession is browser-specific
    window.ApplePaySession?.canMakePayments?.();

  const googleAvailable =
    googlePayEnabled && typeof window !== "undefined" && "PaymentRequest" in window;

  if (!appleAvailable && !googleAvailable) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {appleAvailable && (
        <Button type="button" variant="secondary" disabled={disabled} onClick={onApplePay}>
          Apple Pay
        </Button>
      )}
      {googleAvailable && (
        <Button type="button" variant="secondary" disabled={disabled} onClick={onGooglePay}>
          Google Pay
        </Button>
      )}
    </div>
  );
}
