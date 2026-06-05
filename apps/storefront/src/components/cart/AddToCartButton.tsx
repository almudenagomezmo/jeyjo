"use client";

import { Button } from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/icons";
import { useCartStore } from "@/lib/store/cart-store";
import type { CartAddAnalytics } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import type { ButtonProps } from "@/components/ui/Button";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: Pick<Product, "id" | "packSize" | "stock">;
  analytics?: CartAddAnalytics;
  qty?: number;
  label?: string;
  openCart?: boolean;
  disabled?: boolean;
  onAdded?: () => void;
}

export function AddToCartButton({
  product,
  analytics,
  qty,
  label = "Añadir al carrito",
  openCart = true,
  disabled: disabledProp,
  onAdded,
  ...buttonProps
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const outOfStock = product.stock === 0;
  const disabled = disabledProp ?? outOfStock;

  return (
    <Button
      iconStart={<CartIcon size={16} />}
      disabled={disabled}
      onClick={() => {
        addItem(product.id, qty ?? product.packSize, analytics);
        onAdded?.();
        if (openCart) setMiniCartOpen(true);
      }}
      {...buttonProps}
    >
      {disabled && (label?.startsWith("Sin stock") || outOfStock) ? "Sin stock" : label}
    </Button>
  );
}
