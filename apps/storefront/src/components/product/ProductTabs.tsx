"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PdpAttachment, PdpSpecRow } from "@/lib/pdp/types";

type Tab = "descripcion" | "especificaciones" | "adjuntos" | "envio";

export function ProductTabs({
  longDescriptionHtml,
  specRows,
  attachments,
}: {
  longDescriptionHtml: string | null;
  specRows: PdpSpecRow[];
  attachments: PdpAttachment[];
}) {
  const hasAttachments = attachments.length > 0;
  const tabs: { id: Tab; label: string }[] = [
    { id: "descripcion", label: "Descripción" },
    { id: "especificaciones", label: "Especificaciones técnicas" },
    ...(hasAttachments ? [{ id: "adjuntos" as Tab, label: "Descargas" }] : []),
    { id: "envio", label: "Envío y devoluciones" },
  ];

  const [tab, setTab] = useState<Tab>("descripcion");

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
            {longDescriptionHtml ? (
              <div
                className="prose-pdp text-[17px] text-text [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-bold [&_li]:text-sm [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: longDescriptionHtml }}
              />
            ) : (
              <p className="text-sm text-text-tertiary">Sin descripción ampliada.</p>
            )}
          </div>
        )}

        {tab === "especificaciones" && (
          <table className="w-full border-collapse">
            <tbody>
              {specRows.map(([k, v]) => (
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

        {tab === "adjuntos" && hasAttachments && (
          <ul className="space-y-3">
            {attachments.map((a) => (
              <li key={a.url}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
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
