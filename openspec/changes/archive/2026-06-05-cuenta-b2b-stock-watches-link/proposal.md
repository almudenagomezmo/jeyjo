## Why

El cambio **#35** (`wishlist-stock-alerts`) implementó la persistencia server-side de la wishlist y la página operativa **`/intranet/stock`** (Avisos de stock) dentro del portal B2B, pero los usuarios B2B validados que navegan por **`/cuenta`** — porque el header les muestra su nombre comercial y el área de cliente comparte pedidos, presupuestos y direcciones — no encuentran ningún enlace a sus referencias seguidas. Pueden marcar productos con el corazón en catálogo y los datos existen en `stock_watches`, pero la única vía de descubrimiento es el menú intranet, invisible desde el sidebar de `/cuenta`. Esto rompe la expectativa de alcance §1.21 (*"Área de cliente"*) y deja incompleta la UX para perfiles que alternan entre tienda pública y área de cliente sin entrar explícitamente al portal B2B.

## What Changes

- **Enlace condicional en sidebar `/cuenta`:** añadir **Avisos de stock** apuntando a `/intranet/stock` solo cuando la sesión sea B2B validada (`isB2bValidated`); oculto para B2C y B2B pendiente de validación.
- **Tarjeta de acceso rápido en dashboard `/cuenta`:** para usuarios B2B validados, mostrar un bloque resumen con enlace a `/intranet/stock` y texto que explique que ahí están las referencias marcadas con el corazón en catálogo.
- **Etiqueta coherente con intranet:** usar **Avisos de stock** (no "Lista de deseados") para alinear con US-07 CA2 y la página existente.
- **Sin duplicar la página:** no se crea `/cuenta/wishlist`; se enlaza a la implementación ya operativa en intranet.

## Capabilities

### New Capabilities

_(ninguna — reutiliza página y APIs de #35)_

### Modified Capabilities

- `storefront-customer-account`: Sidebar y dashboard B2C deben exponer navegación cruzada hacia avisos de stock para perfiles B2B validados.
- `storefront-wishlist-stock-ui`: Requisito de discoverability desde el área `/cuenta` además del menú intranet.

## Impact

- `apps/storefront/src/components/account/AccountSidebar.tsx`: lista de enlaces condicional según sesión.
- `apps/storefront/src/app/(account)/cuenta/page.tsx`: tarjeta de acceso rápido B2B (server component con `getCustomerContext` + `isB2bValidated`).
- Posible extracción mínima de helper compartido para enlaces B2B en cuenta (opcional, ver design).
- Tests: unit o component test del sidebar condicional; checklist manual US-07 / alcance §1.21.
- Dependencia satisfecha: **#35** (`wishlist-stock-alerts`), **#16** (auth), **#22** (portal B2B shell).
- No afecta Supabase, CMS, APIs ni migraciones.

## Non-Goals

- **Página `/cuenta/avisos-stock` duplicada** o embed de `StockWatchesTable` en layout cuenta (opción B — fuera de alcance).
- **Icono de corazón en header** con contador (opción C).
- **Wishlist visible para B2C** o B2B no validado; v1 mantiene la restricción de #35.
- **Cambiar redirección post-login** para forzar `/intranet` en lugar de `/cuenta`.
- **Preferencias de notificación wishlist** en `/cuenta/perfil`; siguen en `/intranet/mi-cuenta`.
- **Renombrar** "Avisos de stock" a "Lista de deseados" en toda la app.
