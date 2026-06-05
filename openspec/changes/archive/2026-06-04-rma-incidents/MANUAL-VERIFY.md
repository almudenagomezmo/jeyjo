# Manual verification — rma-incidents

## CA-B2B-005 (RF-021 / US-13)

1. Iniciar sesión B2B como `empresa@test.com` (cliente validado).
2. Abrir `/intranet/rma`.
3. Comprobar aviso: **ninguna devolución sin autorización previa** (US-13 CA4).
4. Enviar formulario: referencia `REF-011`, albarán `ALB-2026-001`, motivo **Artículo incorrecto**, observaciones `Pedí azul, me enviaron rojo`.
5. Ver toast con número `RMA-2026-XXXX` y fila en pestaña **Abiertas** con estado **Solicitada**.
6. En Mailpit (dev): email con el número RMA.
7. En Payload `/admin/rma`: la incidencia aparece en menos de 1 minuto.

## US-13 CA3 — cerradas

1. En inbox staff, pasar incidencia a **En revisión** → **Autorizada** o **Rechazada**.
2. En portal, pestaña **Cerradas** muestra la incidencia con el estado final.
3. Pestaña **Abiertas** ya no la lista.

## Rollback (`RMA_INCIDENTS_ENABLED=false`)

No hay feature flag en código v1. Para revertir:

1. Restaurar `apps/storefront/src/app/(b2b)/intranet/rma/page.tsx` con `IntranetScaffoldPage`.
2. Restaurar bloque `scaffold` en `navigation.ts` para `/intranet/rma`.
3. Eliminar rutas `app/api/intranet/rma-incidents`.
4. Opcional: desregistrar colección y endpoints en CMS.
