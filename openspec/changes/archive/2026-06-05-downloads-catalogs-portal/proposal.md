## Why

El portal B2B (#22) expone `/intranet/descargas` como scaffold vacío; sin el repositorio de **catálogos PDF y revistas de ofertas con vigencia** del alcance §1.24, los compradores profesionales no pueden consultar material comercial vigente sin contactar a su comercial — un hueco explícito en **US-07 CA2** (menú Descargas sin funcionalidad). Payload (#3) y el shell intranet (#22) ya están operativos; el patrón de sustituir scaffolds por vistas productivas está probado en histórico (#23), precios (#25) y avisos de stock (#35). Es el cambio **#41** del ROADMAP; dependencias **#3** y **#22** completadas.

## What Changes

- **Colección Payload `b2b-catalog-downloads`:** documentos comerciales (catálogo general, revista de ofertas, ficha técnica comercial) con título, descripción, PDF en `media`, tipo, portada opcional, `validFrom` / `validUntil` y segmentación opcional por `customer_group` (2, 3, 4).
- **Filtrado por vigencia:** solo documentos con `validFrom ≤ hoy ≤ validUntil` y `published: true` son visibles en portal; caducados desaparecen automáticamente sin intervención manual.
- **Página `/intranet/descargas`:** sustituir `IntranetScaffoldPage` por listado agrupado por tipo (Catálogos / Revistas de ofertas / Otros), tarjeta con título, descripción, rango de vigencia, portada y botón de descarga PDF.
- **API storefront:** `GET /api/intranet/catalog-downloads` devuelve documentos vigentes para el `customer_group` de la sesión B2B validada (401/403 según guards existentes).
- **Descarga segura:** enlace de descarga vía URL absoluta de `media` (mismo patrón que adjuntos PDP); acceso solo tras guard intranet y permiso subusuario `orders` (#26).
- **Backoffice:** colección en grupo Marketing/Personalización con roles `marketing`, `personalizacion` y `superadmin`; audit log en altas/ediciones/bajas.
- **Seed de desarrollo:** al menos un catálogo vigente y una revista caducada para validar filtrado.
- **Tests:** unit (filtro vigencia, segmentación grupo), integración API (auth B2B, exclusión caducados), checklist manual US-07.

## Capabilities

### New Capabilities

- `payload-b2b-catalog-downloads`: Colección Payload con campos de vigencia, tipo, PDF, segmentación por grupo y acceso staff.
- `storefront-b2b-catalog-downloads`: UI y API del portal en `/intranet/descargas` — listado, descarga y guards B2B (alcance §1.24, **US-07 CA2**).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Sustituir escenario de scaffold en `/intranet/descargas` por vista de producción; quitar metadata `scaffold` del ítem de navegación.

## Impact

- `apps/cms`: nueva colección `B2bCatalogDownloads`, registro en `payload.config.ts`, tipos generados, seed opcional.
- `apps/storefront`: `app/(b2b)/intranet/descargas/page.tsx`, componentes `CatalogDownloads*`, `lib/intranet/catalog-downloads/**`, ruta `app/api/intranet/catalog-downloads/`.
- `apps/storefront/src/lib/intranet/navigation.ts`: eliminar `scaffold` en Descargas.
- Reutiliza: `guardIntranetPage`, permisos subusuario (`orders`), `absolute-media-url`, `STOREFRONT_PAYLOAD_API_KEY`.
- Cumple alcance §1.24, **US-07 CA2**; complementa precios (#25) donde **US-14 CA4** menciona revistas de ofertas (aquí el repositorio descargable).
- Dependencias satisfechas: **#3** Payload bootstrap, **#22** portal shell, **#26** permisos subusuario.

## Non-Goals

- **Área documental financiera** (facturas, albaranes, 347) — cambio **#37**; no mezclar con catálogos comerciales.
- **Adjuntos por producto en PDP** — ya cubiertos por **RF-012** en enriquecimiento PIM; no duplicar manuales técnicos aquí salvo que staff los publique explícitamente como documento comercial.
- **Subida de PDFs para EVA/SKAI** — **US-20** en `backoffice-skai-config`; reutilización opcional de ficheros, sin acoplar flujos en v1.
- **Descargas en área B2C `/cuenta`** — v1 solo intranet B2B validada.
- **Sincronización ERP** de catálogos PDF — fuente de verdad web v1 es Payload; sin import Avansuite.
- **Notificaciones** al publicar catálogo nuevo (**#28**).
- **Analytics de descargas** o KPI en dashboard (#30).
- **Supabase Storage dedicado** para estos PDFs en v1 — usar colección `media` existente (arquitectura prevé PDFs catálogos en Storage a medio plazo; migración futura si volumen lo exige).
- **Preview inline** del PDF en navegador — v1 botón descarga/abrir en nueva pestaña.

## Assumptions

- Vigencia inclusiva en ambos extremos: documento visible el día de `validFrom` y el día de `validUntil` (comparación por fecha calendario Europe/Madrid).
- Sin `customerGroups` seleccionados = visible para todos los grupos B2B (2, 3, 4).
- Tipos cerrados: `catalog`, `offer_magazine`, `other`; etiquetas UI en español.
- PDF máximo 25 MB (límite upload Payload/media, alineado con práctica backoffice).
- Idioma UI: español.
- Seed: catálogo "Catálogo General 2026" vigente + revista "Ofertas Q1 2025" caducada para tests.
