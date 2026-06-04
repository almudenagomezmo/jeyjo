# Testing

## Tests de integración (Vitest)

```bash
pnpm test:int
```

- Framework: Vitest
- Entorno: jsdom
- Ubicación: `tests/int/*.int.spec.ts`
- Setup: carga variables de entorno con dotenv

## Tests E2E (Playwright)

```bash
pnpm test:e2e
```

- Framework: Playwright
- Ubicación: `tests/e2e/*.e2e.spec.ts`
- Navegador: Chromium
- Reintentos: 1 (local), 3 (CI)
- Arranca automáticamente `pnpm dev` como webServer

### Tests E2E disponibles

| Archivo | Descripción |
|---|---|
| `admin.e2e.spec.ts` | Navegación en el admin panel |
| `frontend.e2e.spec.ts` | Flujo completo: registro, login, carrito, checkout con Stripe, pedidos guest, CRUD admin |

## Tests completos

```bash
pnpm test
# Ejecuta: test:int && test:e2e
```

## Helpers

| Archivo | Uso |
|---|---|
| `tests/helpers/seedUser.ts` | Crea/limpia usuario de test (`dev@payloadcms.com` / `test`) |
| `tests/helpers/login.ts` | Login programático en admin panel |

## Variables de entorno para tests

```env
# test.env
NODE_OPTIONS="--no-deprecation --no-experimental-strip-types"
```
