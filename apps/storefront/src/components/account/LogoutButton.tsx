"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={() => void logout()}>
      Cerrar sesión
    </Button>
  );
}
