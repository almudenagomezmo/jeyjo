## Context

- **Estado actual:** `/intranet/rma` renderiza `IntranetScaffoldPage` (cambio #22). OMS (#20) y quotes (#19) demuestran persistencia operativa en Payload con bandejas staff, numeración secuencial y email transaccional vía transport Payload (Mailpit/Resend). No existe colección ni tabla `rma_incidents`; la arquitectura (#04) modela `INCIDENCIA_RMA` en Supabase pero el patrón vigente para documentos web es Payload (pedidos, presupuestos).
- **Requisito crítico:** **US-13 CA1–CA4**, **RF-021**, **CA-B2B-005** — formulario con campos obligatorios, número RMA único, estado inicial Solicitada, listado abierto/cerrado, aviso de autorización previa, email de confirmación y visibilidad en backoffice < 1 min.
- **Dependencias completadas:** #20 OMS, #22 portal shell, #16 auth B2B, #19 email transaccional (patrón reutilizable).

## Goals / Non-Goals

**Goals:**

- Formulario B2B autenticado y listado de incidencias en `/intranet/rma`.
- Colección Payload `rma-incidents` con numeración `RMA-{YYYY}-{seq}` y ciclo de estados RF-021.
- Bandeja staff con filtros y transiciones auditadas.
- Email de confirmación al crear (no al cambiar estado en v1).
- APIs storefront con guard B2B validado.

**Non-Goals:**

- Lookup ERP de albaranes (#37).
- Adjuntos, notificaciones in-app (#28), sync Avansuite (#36).
- Permisos por subusuario (#26).
- RMA B2C.

## Decisions

### 1. Modelo de documento `RmaIncident`

**Decisión:** Colección Payload `rma-incidents`:

| Campo | Tipo | Notas |
|-------|------|-------|
| `rmaNumber` | text unique | Hook `beforeValidate`, formato `RMA-{YYYY}-{seq}` |
| `status` | select | `requested`, `in_review`, `authorized`, `rejected` |
| `customerRef` | text (uuid) | Supabase `customers.id` |
| `articleSku` | text | Referencia artículo (trim, uppercase opcional server) |
| `deliveryNoteNumber` | text | Número albarán libre v1 |
| `reason` | select | `wrong_item`, `defective`, `wrong_qty`, `other` |
| `observations` | textarea | Obligatorio si `reason === other`; opcional resto |
| `emailSentAt` | date | null si falló email |
| `createdAt` | auto | |

**Alternativa descartada:** Tabla Supabase `rma_incidents` — duplicaría bandeja staff ya centrada en Payload; migración futura posible si ERP exige mirror.

### 2. Ciclo de estados y transiciones staff

**Decisión:**

```
requested → in_review → authorized
                      → rejected
```

- Cliente solo crea en `requested`.
- Staff `administracion`/`superadmin` transiciona vía inbox o PATCH endpoint interno.
- `authorized` y `rejected` son terminales v1.
- Etiquetas admin ES: Solicitada, En revisión, Autorizada, Rechazada.

**Alternativa descartada:** Cliente puede cancelar — fuera de RF-021 v1; contacto comercial.

### 3. APIs storefront

**Decisión:**

- `GET /api/intranet/rma-incidents?status=open|closed|all&page&pageSize` — lista documentos del `customerRef` de sesión, orden `createdAt` desc.
- `POST /api/intranet/rma-incidents` body `{ articleSku, deliveryNoteNumber, reason, observations? }` — valida campos, crea vía Payload REST con API key storefront, dispara email async, responde `{ rmaNumber, status, id }`.

Guard: mismo helper `requireValidatedB2bSession` que purchase-history.

**Alternativa descartada:** Crear directamente en Supabase desde storefront — sin bandeja Payload unificada.

### 4. Email confirmación

**Decisión:** Tras persist exitoso, CMS hook o llamada desde storefront a endpoint interno `POST /api/rma/send-confirmation` con `rmaNumber` + email destino. Plantilla HTML mínima: número RMA, referencia, albarán, motivo legible, copy “Ninguna devolución sin autorización previa”. Patrón idéntico a `quote-request-confirmation-email`: fallo no revierte documento; `emailSentAt` null + log.

**Alternativa descartada:** Email desde storefront con Resend directo — duplicaría transport y secretos fuera de CMS.

### 5. UI `/intranet/rma`

**Decisión:** Layout dos bloques en una página:

1. **Aviso normativo** (banner info): “Ninguna devolución se acepta sin autorización previa de Jeyjo” (**US-13 CA4**).
2. **Formulario** (client): campos RF-021, select motivo, textarea observaciones, botón **Enviar solicitud**; éxito limpia form y refresca listado + toast con número RMA.
3. **Listado** (server + client tabs): pestañas **Abiertas** / **Cerradas** / **Todas**; tabla desktop / cards móvil con badges de estado (tokens `--color-*`).

Enriquecimiento opcional: lookup CMS por `articleSku` para mostrar título producto en listado si existe (no bloquea envío si no catalogado).

Quitar `scaffold` de `navigation.ts` para `/intranet/rma`.

**Alternativa descartada:** Wizard multi-paso — innecesario para 4 campos.

### 6. Bandeja backoffice

**Decisión:** Vista custom `RmaInboxView` (patrón `QuotesInboxView` / OMS inbox) registrada en Payload admin nav bajo Operaciones. Columnas: número RMA, fecha, cliente (commercial name vía `customerRef` lookup Supabase o label cache), SKU, albarán, motivo, estado. Filtros: estado, rango fechas, búsqueda número/SKU/albarán. Acciones: dropdown transición válida; audit log en cada cambio.

Endpoint staff: reutilizar patrón `PATCH /api/rma-incidents/:id/status` con auth Payload.

**Alternativa descartada:** Solo colección CRUD sin inbox — peor UX operativa US-17/RF-021.

### 7. Validación albarán v1

**Decisión:** Campo texto obligatorio, trim, longitud 3–40; regex sugerido `^ALB-\d{4}-\d+$` solo para warning UI opcional, **no** bloquea submit. Sin llamada `ErpDocumentsReader` (#37).

**Alternativa descartada:** Validar albarán en stub ERP — no hay datos documentales aún.

### 8. Numeración secuencial

**Decisión:** Hook Payload `beforeValidate` consulta último `rmaNumber` del año (`RMA-2026-0042` → seq 43). Mismo enfoque que `quoteNumber`. Índice unique en `rmaNumber`.

## Risks / Trade-offs

- **[Albarán inexistente en ERP]** Cliente puede enviar referencia errónea → Mitigation: staff valida en revisión; mensaje UI “Introduce el número que figura en tu albarán”.
- **[Email falla]** Incidencia existe sin confirmación al cliente → Mitigation: `emailSentAt` null + indicador en inbox staff; reenvío manual v1.
- **[Doble submit formulario]** Dos incidencias duplicadas → Mitigation: disable button on submit + idempotency key opcional (hash sku+albarán+fecha día) devuelve 409.
- **[Sin notificación cambio estado]** Cliente debe refrescar listado → Mitigation: #28 añadirá push/email; documentar en non-goals.
- **[Payload como única fuente]** ERP Avansuite no refleja RMA web → Mitigation: export manual o sync en #36; CA-B2B-005 valida bandeja Payload < 1 min.

## Migration Plan

1. Añadir colección Payload + tipos generados; seed opcional incidencia demo.
2. Implementar email hook y plantilla.
3. APIs storefront + tests integración.
4. Sustituir página RMA y quitar scaffold en `navigation.ts`.
5. Registrar inbox admin + tests transiciones.
6. Rollback: restaurar `IntranetScaffoldPage`; desactivar rutas API (`RMA_INCIDENTS_ENABLED=false` opcional).

## Open Questions

- ¿Idempotencia estricta mismo SKU+albarán en 24h? **Default: sí, 409 con mensaje amigable.**
- ¿Mostrar título producto en listado si SKU no está en catálogo? **Default: mostrar solo SKU.**
- ¿Staff puede volver de `rejected` a `in_review`? **Default: no en v1.**
