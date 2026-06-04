# Verificación manual OMS (staging)

## CA-BACKEND-003 — Bandeja EVA

1. Iniciar sesión staff con rol `administracion` + MFA.
2. Abrir `/admin/oms/eva`.
3. Confirmar pedido seed `EVA-2026-0015` visible.
4. Pulsar **Revisar y Validar** → pedido desaparece de la cola y `validatedEva=true`.
5. Opcional: crear otro pedido `origin=eva` y **Rechazar** con motivo → `jeyjoStatus=cancelled`.

## CA-BACKEND-004 — Export Avansuite

1. Abrir `/admin/oms` o ficha de pedido confirmado con líneas en `orderLineSnapshots`.
2. Pulsar **Exportar** → descarga `.xlsx`.
3. Importar en Avansuite test según `apps/cms/docs/avansuite-order-import.md`.
4. Confirmar albarán sin errores de formato.

## CA-BACKEND-006 — Rol catálogo

1. Usuario solo `catalogo` → `/admin/oms` y `GET /api/orders/inbox-summary` deben devolver 403.
