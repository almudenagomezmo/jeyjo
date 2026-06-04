## 1. Monorepo workspace

- [x] 1.1 Crear `pnpm-workspace.yaml` con `apps/*` y `package.json` raíz con scripts `dev`, `build`, `lint`, `typecheck`
- [x] 1.2 Copiar `especificaciones_inicio/diseño/jeyjo-next` a `apps/storefront` y renombrar paquete a `@jeyjo/storefront`
- [x] 1.3 Copiar `jeyjo_back` a `apps/cms`, configurar puerto 3001 y README de deuda Stripe/template
- [x] 1.4 Añadir `.env.example` en `apps/storefront` y `apps/cms`
- [x] 1.5 Actualizar README raíz con comandos pnpm y enlace a `openspec/ROADMAP.md`

## 2. Design tokens

- [x] 2.1 Verificar `apps/storefront/src/app/globals.css` coincide con tokens jeyjo-next (`:root`, `.dark`, `@theme inline`)
- [x] 2.2 Documentar en README storefront que colores de marca solo se editan en `globals.css`

## 3. Storefront UI primitives y shell

- [x] 3.1 Portar `components/ui` mínimos (Button, Card, Input, Badge, Logo) y `lib/utils/cn.ts`
- [x] 3.2 Portar `components/layout` (TopBar, Header, Footer, Container, ThemeToggle)
- [x] 3.3 Asegurar `layout.tsx` carga fuentes, shell y toggle tema sin FOUC
- [x] 3.4 Simplificar `page.tsx` a placeholder sin dependencia de catálogo mock pesado (opcional: mantener mock local)
- [x] 3.5 Incluir `lib/utils/price.ts` y `format.ts` desde prototipo

## 4. CMS bootstrap

- [x] 4.1 Verificar `pnpm --filter cms dev` arranca Payload admin
- [x] 4.2 Verificar `pnpm --filter cms build` (o documentar skip CI si requiere DB)

## 5. CI pipeline

- [x] 5.1 Crear `.github/workflows/ci.yml` con install, lint, typecheck, build storefront
- [x] 5.2 Añadir job cms lint/typecheck; build cms condicionado a `DATABASE_URL` en secrets o skip documentado
- [x] 5.3 Ejecutar workflow localmente o validar scripts `pnpm lint && pnpm build` en raíz

## 6. Verificación final

- [x] 6.1 `pnpm install` y `pnpm --filter storefront dev` — home con shell y tokens
- [x] 6.2 Revisar que no hay hex hardcodeados en primitives (grep rápido)
- [x] 6.3 `openspec status --change foundation-monorepo-design-system` muestra artefactos completos
