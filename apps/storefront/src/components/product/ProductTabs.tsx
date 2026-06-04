"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types";

type Tab = "descripcion" | "especificaciones" | "envio";

export function ProductTabs({ product, categoryName }: { product: Product; categoryName: string }) {
  const [tab, setTab] = useState<Tab>("descripcion");

  const tabs: { id: Tab; label: string }[] = [
    { id: "descripcion", label: "Descripción" },
    { id: "especificaciones", label: "Especificaciones técnicas" },
    { id: "envio", label: "Envío y devoluciones" },
  ];

  const specs: [string, string][] = [
    ["Marca", product.brand],
    ["Referencia Jeyjo", product.ref],
    ["Referencia fabricante (OEM)", product.oem ?? "—"],
    ["Código EAN", product.ean],
    ["Envase de venta", `${product.packSize} ${product.packSize === 1 ? "unidad" : "unidades"}`],
    ["IVA aplicable", `${product.vat}%`],
    ["Categoría", categoryName],
  ];

  return (
    <div className="mt-14">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold",
              tab === t.id
                ? "border-primary text-text"
                : "border-transparent text-text-tertiary hover:text-text-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl py-6">
        {tab === "descripcion" && (
          <div className="space-y-4 leading-relaxed text-text-secondary">
            <p className="text-[17px] text-text">{product.description}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Apto para uso profesional intensivo.</li>
              <li>Compatible con los principales accesorios del mercado.</li>
              <li>Servicio postventa y soporte humano.</li>
              {product.eco && <li>Materiales reciclables o de bajo impacto ambiental.</li>}
            </ul>
          </div>
        )}

        {tab === "especificaciones" && (
          <table className="w-full border-collapse">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b border-border-subtle">
                  <td className="w-60 py-3 text-sm text-text-secondary">{k}</td>
                  <td
                    className={cn(
                      "py-3 text-sm",
                      (k.includes("EAN") || k.includes("Referencia")) && "font-mono",
                    )}
                  >
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "envio" && (
          <div className="space-y-5 text-sm leading-relaxed text-text-secondary">
            <div>
              <h3 className="text-base font-bold text-text">Plazos de entrega</h3>
              <p className="mt-1">
                Pedidos confirmados antes de las 15:00 (L-V) salen el mismo día. Entrega habitual en
                24-48 h laborables en península.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Gastos de envío</h3>
              <p className="mt-1">
                B2C: gratis a partir de 39 € · 5,00 € si el pedido es inferior. B2B (empresas):
                gratis a partir de 10 € sin IVA · 2,50 € si es inferior.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Devoluciones</h3>
              <p className="mt-1">
                Dispones de 14 días para devolver tu pedido. Toda devolución debe ser autorizada
                previamente mediante el formulario RMA de tu área de cliente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
