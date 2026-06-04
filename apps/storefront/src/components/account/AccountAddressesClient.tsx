"use client";

import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressList } from "@/components/account/AddressList";
import { Card } from "@/components/ui/Card";

export function AccountAddressesClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Direcciones</h1>
      <p className="text-sm text-text-secondary">
        Direcciones de envío para checkout. La facturación se gestiona en tu perfil.
      </p>
      <AddressList refreshKey={refreshKey} />
      <Card className="p-6">
        <AddressForm onCreated={() => setRefreshKey((k) => k + 1)} />
      </Card>
    </div>
  );
}
