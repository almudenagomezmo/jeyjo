"use client";

import { Button } from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/icons";
import { useCartStore } from "@/lib/store/cart-store";
import { useUiStore } from "@/lib/store/ui-store";
import type { ButtonProps } from "@/components/ui/Button";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: Pick<Product, "id" | "packSize" | "stock">;
  qty?: number;
  label?: string;
  openCart?: boolean;
}

export function AddToCartButton({
  product,
  qty,
  label = "Añadir al carrito",
  openCart = true,
  ...buttonProps
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setMiniCartOpen = useUiStore((s) => s.setMiniCartOpen);
  const outOfStock = product.stock === 0;

  return (
    <Button
      iconStart={<CartIcon size={16} />}
      disabled={outOfStock}
      onClick={() => {
        addItem(product.id, qty ?? product.packSize);
        if (openCart) setMiniCartOpen(true);
      }}
      {...buttonProps}
    >
      {outOfStock ? "Sin stock" : label}
    </Button>
  );
}
