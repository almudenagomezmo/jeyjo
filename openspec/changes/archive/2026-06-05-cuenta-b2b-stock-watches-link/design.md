## Context

Tras **#35** (`wishlist-stock-alerts`), la wishlist server-side y la página `/intranet/stock` están operativas para perfiles B2B validados. El área `/cuenta` (`storefront-customer-account`, cambio **#16**) evolucionó con pedidos, presupuestos y direcciones, pero su sidebar (`AccountSidebar.tsx`) sigue siendo una lista estática de cinco enlaces sin referencia a avisos de stock.

Usuarios B2B validados pueden llegar a `/cuenta` porque:
- Navegan manualmente o siguen bookmarks.
- Algunos flujos (presupuestos, direcciones) viven solo en `/cuenta`.
- El header enlaza a `/intranet`, pero el sidebar de cuenta no refleja la wishlist.

La detección de B2B validado ya existe en `isB2bValidated(ctx)` (`lib/auth/redirect.ts`) y se usa en `NavigationShell`, guards intranet y PDP.

## Goals / Non-Goals

**Goals:**

- Hacer discoverable `/intranet/stock` desde el sidebar de `/cuenta` para sesiones B2B validadas.
- Añadir un acceso rápido en el dashboard `/cuenta` con copy orientado a referencias marcadas con el corazón.
- Mantener una sola fuente de verdad: la página intranet existente (sin duplicar UI ni APIs).

**Non-Goals:**

- Nueva ruta bajo `/cuenta/*`.
- Wishlist para B2C o B2B pendiente.
- Cambios en header, APIs, Supabase o notificaciones.

## Decisions

### 1. Enlace externo a `/intranet/stock` (no subruta `/cuenta`)

**Decisión:** El sidebar de cuenta enlaza a `/intranet/stock` con etiqueta **Avisos de stock**.

**Alternativas:**
- *Embed `StockWatchesTable` en `/cuenta/avisos-stock`* — más código, dos layouts, fuera de opción A.
- *Redirect `/cuenta/avisos-stock` → `/intranet/stock`* — capa extra sin beneficio UX.

**Rationale:** Reutiliza guard, layout intranet y componentes de #35; esfuerzo mínimo.

### 2. Prop `showStockWatchesLink` desde layout servidor

**Decisión:** `cuenta/layout.tsx` (Server Component) llama `getCustomerContext()` + `isB2bValidated(ctx)` y pasa `showStockWatchesLink` a `AccountSidebar`.

**Alternativas:**
- *Fetch en cliente* — flash de enlace incorrecto, peor SEO/a11y.
- *Convertir sidebar a Server Component* — pierde `usePathname` para estado activo sin split.

**Rationale:** Patrón ya usado en `NavigationShell` y `RootLayout`; una lectura de sesión por request en layout es aceptable.

### 3. Estado activo del enlace en sidebar

**Decisión:** No marcar activo el enlace de Avisos de stock cuando el usuario está en `/intranet/stock`, porque esa ruta usa layout intranet, no layout cuenta. El enlace en sidebar cuenta solo aparece en páginas `/cuenta/*`.

**Alternativa:** Highlight si `pathname.startsWith('/intranet/stock')` — imposible desde layout cuenta sin pathname global; no necesario.

### 4. Tarjeta en dashboard `/cuenta/page.tsx`

**Decisión:** Card condicional (solo B2B validado) debajo del resumen de identidad, con título **Avisos de stock**, texto breve y `Link` a `/intranet/stock`. Reutilizar `Card` existente y tokens de diseño.

**Alternativa:** Solo sidebar — insuficiente para usuarios que no exploran el menú lateral.

### 5. Permisos de subusuario B2B

**Decisión:** Mostrar el enlace si `isB2bValidated(ctx)`; la página `/intranet/stock` y `guardIntranetPage` ya aplican `assertIntranetSectionAccess` cuando `B2B_PERMISSIONS_ENABLED` está activo.

**Rationale:** Consistente con otros enlaces cruzados; si el subusuario no tiene permiso de stock, el guard intranet redirige — mismo comportamiento que entrar por menú B2B.

### 6. Constante compartida de href/label (opcional)

**Decisión:** Reutilizar `href: '/intranet/stock'` y `label: 'Avisos de stock'` inline o importar desde `lib/intranet/navigation.ts` (`INTRANET_PRIMARY_NAV` entry) para evitar drift de copy.

## Risks / Trade-offs

- **[Context switch layout]** El usuario sale del layout `/cuenta` al abrir `/intranet/stock` → mitigación: copy en card explica que es la misma lista del portal B2B; enlace de vuelta ya existe vía header/menú intranet.
- **[B2B en `/cuenta` confunde]** Usuario B2B validado puede no saber que también tiene portal → mitigación: card puede mencionar "Portal B2B" de forma secundaria; fuera de alcance cambiar redirect post-login.
- **[Subusuario sin permiso]** Ve enlace pero recibe forbidden al entrar → mitigación: mismo riesgo que menú intranet; no introducimos lógica nueva de permisos en sidebar cuenta en v1.

## Migration Plan

Despliegue frontend-only en `apps/storefront`. Sin migraciones ni flags. Rollback: revertir PR (sidebar vuelve a 5 enlaces, desaparece card).

## Open Questions

- ¿Añadir también enlace **Portal B2B** genérico (`/intranet`) en sidebar cuenta? → **No en v1**; el header ya apunta a `/intranet` para B2B validado.
- ¿Mostrar contador de watches en sidebar? → **No en v1** (requeriría fetch extra o prop desde servidor).
