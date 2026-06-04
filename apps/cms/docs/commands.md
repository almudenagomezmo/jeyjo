# Comandos Rápidos

## Desarrollo

```bash
pnpm dev                          # Servidor de desarrollo (localhost:3000)
pnpm build                        # Build de producción
pnpm start                        # Servir build de producción
pnpm lint                         # ESLint
pnpm lint:fix                     # ESLint con auto-fix
```

## Docker

```bash
docker compose -f docker/docker-compose.yml up -d        # Arrancar servicios
docker compose -f docker/docker-compose.yml down         # Parar servicios
docker compose -f docker/docker-compose.yml logs -f      # Ver logs
docker compose -f docker/docker-compose.yml up -d --build  # Reconstruir y arrancar
```

## Base de datos

```bash
pnpm payload migrate              # Ejecutar migraciones pendientes
pnpm payload migrate:create       # Crear nueva migración
pnpm generate:types               # Regenerar tipos TypeScript de Payload
pnpm generate:importmap           # Regenerar importmap de Payload
```

## Seed

```bash
# POST http://localhost:3000/next/seed (requiere auth admin)
```

## Stripe

```bash
pnpm stripe-webhooks              # Escuchar webhooks de Stripe localmente
```

## Tests

```bash
pnpm test:int                     # Tests de integración (Vitest)
pnpm test:e2e                     # Tests E2E (Playwright)
pnpm test                         # Ambos
```

## Utilidades

```bash
pnpm ii                           # pnpm install ignorando workspace
pnpm reinstall                    # Borrar node_modules y reinstalar
```
