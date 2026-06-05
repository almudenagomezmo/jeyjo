## 1. Sidebar condicional

- [x] 1.1 Añadir prop `showStockWatchesLink` a `AccountSidebar` e insertar enlace **Avisos de stock** → `/intranet/stock` cuando sea `true` (verify: enlace visible solo con sesión B2B validada mock)
- [x] 1.2 En `cuenta/layout.tsx`, resolver `getCustomerContext()` + `isB2bValidated(ctx)` y pasar la prop al sidebar (verify: layout compila sin fetch duplicado innecesario en páginas hijas)

## 2. Dashboard acceso rápido

- [x] 2.1 Crear componente `StockWatchesQuickAccessCard` (o bloque inline en `cuenta/page.tsx`) con copy y `Link` a `/intranet/stock`, visible solo para B2B validado (verify: card no renderiza para B2C en page server)
- [x] 2.2 Reutilizar label/href desde `INTRANET_PRIMARY_NAV` o constante compartida para evitar drift con menú intranet (verify: grep único origen de "Avisos de stock")

## 3. Tests y verificación

- [x] 3.1 Test unit/component: sidebar incluye enlace cuando `showStockWatchesLink=true` y lo omite cuando `false` (verify: `pnpm --filter storefront test`)
- [x] 3.2 Checklist manual: login B2B validado → `/cuenta` → sidebar + card → `/intranet/stock` lista watches; login B2C → sin enlace ni card (verify: escenarios spec `storefront-customer-account`)
