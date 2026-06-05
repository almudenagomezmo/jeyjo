## Context

- **Estado actual:** `/intranet/descargas` renderiza `IntranetScaffoldPage` con copy de roadmap #41. La navegación intranet declara `scaffold` en `navigation.ts`. Permisos subusuario mapean la ruta a sección `orders` (#26). Payload (#3) ya tiene colección `media` para uploads y patrón de audit hooks en colecciones de negocio (RMA #27, cupones #31).
- **Requisito de negocio:** Alcance §1.24 — repositorio de catálogos PDF y revistas de ofertas con `validFrom` / `validUntil`; documentos caducados desaparecen sin acción manual. **US-07 CA2** exige menú Descargas operativo.
- **Referencias:** `storefront-b2b-portal-shell`, `storefront-b2b-subusers`, `absolute-media-url`, `fetch-customer-orders` (patrón REST Payload desde storefront con API key).

## Goals / Non-Goals

**Goals:**

- Colección Payload `b2b-catalog-downloads` gestionable por marketing/personalización.
- Portal B2B muestra solo documentos vigentes y segmentados por `customer_group`.
- Sustituir scaffold por UI productiva alineada con jeyjo-next (cards, badges de vigencia).
- API intranet reutilizable por página y tests.

**Non-Goals:**

- ERP sync, área documental (#37), EVA knowledge (#32), analytics de descargas, B2C `/cuenta`, preview PDF embebido.

## Decisions

### 1. Colección Payload dedicada (no reutilizar `pages` ni globals)

**Decisión:** Nueva colección `b2b-catalog-downloads` en grupo admin "Marketing" con slug estable.

**Rationale:** Vigencia, segmentación por grupo y tipo de documento no encajan en `media` ni en adjuntos de producto (RF-012). Separación clara de documentos comerciales vs. financieros (#37).

**Alternativa descartada:** Tabla Supabase directa — rompe patrón de contenido editorial en Payload y duplica upload pipeline.

### 2. Almacenamiento PDF en colección `media` existente

**Decisión:** Campo `file` como `upload` → `media`; portada opcional en segundo upload.

**Rationale:** Reutiliza pipeline de upload, audit en media, y `resolveAbsoluteMediaUrl` del storefront. Arquitectura §04 menciona Storage para PDFs catálogos a futuro; migración posible sin cambiar contrato de API intranet.

**Alternativa descartada:** Bucket Supabase dedicado en v1 — más infra sin beneficio inmediato para volumen bajo (decenas de PDFs).

### 3. Filtrado de vigencia en servidor (storefront + Payload query)

**Decisión:** Función `isCatalogDownloadActive(doc, now)` en `lib/intranet/catalog-downloads/validity.ts` usando fecha calendario `Europe/Madrid`. Query Payload:

```
published = true
AND validFrom <= today
AND validUntil >= today
AND (customerGroups empty OR contains sessionGroup)
```

**Rationale:** Caducidad automática sin cron ni job de despublicación; coherente con alcance "desaparecen automáticamente al expirar".

**Alternativa descartada:** Cron que pone `published=false` — estado derivable de fechas; evita re-publicar manualmente cada temporada.

### 4. Lectura vía REST Payload desde storefront

**Decisión:** `fetchB2bCatalogDownloads({ customerGroup })` en storefront, análogo a `fetch-customer-orders.ts`:

- Base URL: `CMS_URL` / `NEXT_PUBLIC_PAYLOAD_URL`
- Auth: `STOREFRONT_PAYLOAD_API_KEY` header
- Depth 1 para poblar `file` y `coverImage`

**Rationale:** Patrón establecido; sin credenciales en cliente; RSC puede llamar directamente sin API route intermedia (API route solo para cliente/tests).

### 5. API route `GET /api/intranet/catalog-downloads`

**Decisión:** Route handler con `guardIntranetApi` + chequeo permiso `orders` para subusuarios; devuelve JSON normalizado.

**Rationale:** Tests de integración y posible hidratación cliente futura; misma forma que `stock-watches` y `rma-incidents`.

### 6. UI: cards agrupadas por tipo

**Decisión:** Componente `CatalogDownloadsPage` con secciones `catalog` / `offer_magazine` / `other`; cada card muestra portada (o icono PDF), título, descripción truncada, badge "Vigente hasta DD/MM/YYYY", botón "Descargar PDF" (`target="_blank"` + `rel="noopener"`).

**Rationale:** Consistente con dashboard intranet (cards) y PLP; sin visor inline en v1.

### 7. Acceso staff: marketing + personalizacion

**Decisión:** Registrar colección en `staffRoles.ts` (`canReadCollection` / `canWriteCollection`) para roles `marketing`, `personalizacion`, `superadmin`.

**Rationale:** Alineado con RF staff areas; catálogos comerciales son contenido de marketing, no catálogo ERP.

### 8. Seed de desarrollo

**Decisión:** Script o hook de seed en CMS dev con:

- `Catálogo General 2026` — vigente, tipo `catalog`, grupo todos
- `Ofertas Q1 2025` — caducado (`validUntil` pasado), no debe aparecer en portal

**Rationale:** Validación manual y tests de filtro sin PDF real pesado (fixture PDF mínimo en `apps/cms/tests/fixtures/`).

## Risks / Trade-offs

- **[URLs media públicas]** → PDFs en `/media` pueden ser enlazables si se conoce la URL. Mitigación v1: URLs no listadas en sitio público; solo expuestas tras guard intranet. Futuro: signed URLs o bucket privado si compliance lo exige.
- **[Zona horaria vigencia]** → Comparación por fecha Madrid vs. UTC en Vercel. Mitigación: helper centralizado con `Intl` o `date-fns-tz`; tests fijan `now` mock.
- **[Duplicación con SKAI PDFs]** → Mismo fichero podría subirse dos veces (EVA + descargas). Mitigación: documentar en admin; reutilización manual v1; sin sync automática.
- **[Sin notificación de nuevo catálogo]** → Clientes deben revisar sección. Aceptado en non-goals (#28 futuro).

## Migration Plan

1. Desplegar CMS con colección `b2b-catalog-downloads` (sin documentos publicados — portal muestra empty state, no scaffold).
2. Desplegar storefront con página productiva y navegación sin `scaffold`.
3. Staff publica primer catálogo vigente en staging; smoke test US-07 Descargas.
4. Producción: marketing sube catálogos de temporada con fechas.
5. **Rollback:** revertir storefront a scaffold (navegación con `scaffold` metadata); colección CMS inofensiva si vacía.

### Rollback rápido (operaciones)

Si hay que desactivar la sección sin revertir el despliegue completo:

1. En `apps/storefront/src/lib/intranet/navigation.ts`, restaurar el bloque `scaffold` en el ítem Descargas (ver commit archive o cambio #41).
2. En `apps/storefront/src/app/(b2b)/intranet/descargas/page.tsx`, volver a `IntranetScaffoldPage` con `getScaffoldForPath('/intranet/descargas')`.
3. La colección `b2b-catalog-downloads` en CMS puede permanecer; con `published: false` en todos los documentos el portal mostrará empty state si solo se revierte parcialmente el paso 2.

## Open Questions

1. ¿Marketing necesita orden manual de documentos dentro de cada tipo? (v1: orden por `validFrom` desc; campo `sortOrder` opcional si lo piden en UAT.)
2. ¿Colegios (grupo 3) reciben catálogos distintos de empresa B2B en producción? (v1 soporta filtro; contenido inicial TBD por negocio.)
