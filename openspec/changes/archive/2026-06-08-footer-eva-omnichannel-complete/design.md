## Context

- **Estado actual:** `Footer.tsx` renderiza logo, catálogo CMS, dos columnas estáticas con `href: "#"`, teléfono/email desde `getContactConfig()`, newsletter (#39) y barra copyright/métodos de pago como texto. EVA widget (#32) montado en root layout con fallback contacto en panel de error. `systemSettings` (#42) ya persiste WhatsApp y tiendas Alfaro/Rincón; `skaiSettings` tiene `businessHours`. No hay global footer ni páginas `/legal/*` / `/ayuda/faq`.
- **Referencias:** Alcance **§1.12**, **US-22** CA3, ROADMAP **#40** (deps **#9**, **#32**), `storefront-app-shell`, `backoffice-system-settings`.

## Goals / Non-Goals

**Goals:**

- Footer público conforme §1.12 sin placeholders `#` en enlaces operativos.
- Configuración staff de redes, badge UE y toggles sin redeploy.
- Páginas legales/FAQ editables en Payload con rutas estables en storefront.
- Coherencia contacto footer ↔ EVA fallback (mismos teléfonos/WhatsApp/horario).
- Responsive grid alineado a jeyjo-next (`bg-ink`, columnas existentes + newsletter).

**Non-Goals:**

- Blog (#33), mapas embebidos, i18n, footer en portal B2B, CMS de tickets.

## Decisions

### 1. Global `footerSettings` separado + extensión de `SystemConfigDto`

**Decisión:** Nuevo global Payload `footerSettings` (grupo "Configuración del sistema") para campos exclusivos del pie: redes sociales, badge UE (upload + alt + enlace), `blogEnabled`, `blogLabel`, toggles de sección. Extender `GET /api/system/config` con bloque `footer` agregando contacto/tiendas existentes y `businessHours` resuelto (SKAI → system default).

**Rationale:** Evita inflar `systemSettings` con assets sociales/UE; un solo fetch storefront (`fetchSystemConfig`) mantiene patrón #42.

**Alternativa descartada:** Duplicar contacto en `footerSettings` — riesgo de divergencia con checkout/EVA.

### 2. Colección Payload `sitePages` para legal y FAQ

**Decisión:** Colección `sitePages` con campos: `slug` (unique), `title`, `pageType` (`legal` | `faq` | `help`), `content` (Lexical rich text), `metaDescription`, `published`. Storefront resuelve `/legal/[slug]` filtrando `pageType=legal` y `/ayuda/faq` con documento slug fijo `faq` o primer doc `pageType=faq`.

**Rationale:** Legal necesita edición frecuente sin deploy; FAQ puede crecer; reutilizable para futuras páginas ayuda.

**Alternativa descartada:** MDX estático en repo — legal no puede editar sin PR.

### 3. Refactor Footer en subcomponentes server-friendly

**Decisión:**

```
Footer.tsx (server)
├── FooterBrand + FooterOmnichannel (contact + hours + EVA hint)
├── FooterStores (alfaro/rincon from config)
├── FooterLinkColumns (catalog + comprar + ayuda — hrefs from lib/footer/links.ts constants + CMS overrides)
├── FooterSocial
├── NewsletterSignup (existing client)
├── FooterEuBadge
└── FooterLegalBar (copyright, payment icons, legal micro-links)
```

Props: `tree`, `newsletterSettings`, `defaultEmail`, `config: SystemConfigDto` (contact + footer + businessHours).

**Rationale:** Testabilidad; columnas de enlaces centralizadas en `links.ts` para evitar `#` dispersos.

### 4. Resolución de horario y WhatsApp (precedencia SKAI → system)

**Decisión:** Helper `resolvePublicContact()` en storefront:

1. `skaiSettings.businessHours` / fallback phones (via bootstrap cache or config endpoint)
2. `systemSettings` contact fields
3. Defaults documentados en `defaults.ts`

WhatsApp link: `https://wa.me/${digitsOnly(whatsapp)}` con `rel="noopener noreferrer"`.

**Rationale:** Alinea **US-22** CA3 con footer visible sin abrir widget.

### 5. Enlaces de columnas estáticas → rutas v1

**Decisión:** Mapa fijo en código (actualizable por env solo si necesario):

| Label | Route |
|-------|-------|
| Envíos y plazos | `/legal/envios` |
| Devoluciones y RMA | `/legal/devoluciones` |
| Formas de pago | `/legal/formas-pago` |
| Empresas B2B | `/registro` |
| Solicitar presupuesto | `/presupuesto` |
| Centro de ayuda | `/ayuda/faq` |
| Contacto | `/legal/contacto` o `mailto:` |
| Mi cuenta | `/cuenta` |
| Buscar | `/search` |
| Seguimiento pedido | `/cuenta/pedidos` |
| Privacidad y cookies | `/legal/privacidad` + `/legal/cookies` |

Barra inferior: aviso legal, privacidad, cookies como enlaces compactos.

### 6. Blog link condicional

**Decisión:** Renderizar enlace "Blog" en columna Ayuda solo si `footerSettings.blogEnabled`. Href `/blog` (ruta futura #33). Sin stub page en este cambio.

**Rationale:** Evita 404 antes de #33; staff activa cuando blog exista.

### 7. Métodos de pago: iconos SVG inline accesibles

**Decisión:** Componente `PaymentMethodIcons` con SVGs monocromáticos (`currentColor`, `text-neutral-400`) + `aria-label` por marca; conservar texto fallback en `sr-only` para lectores de pantalla.

**Rationale:** Mejora §1.12 sin dependencia de CDN de logos con CSP.

### 8. Seed y migración de contenido

**Decisión:** Script seed CMS (`pnpm --filter cms seed:site-pages`) inserta páginas legales placeholder "Pendiente de revisión legal" + FAQ mínima (5 preguntas frecuentes). Idempotente por slug.

## Risks / Trade-offs

- **[Copy legal placeholder]** → Mitigation: banner visible "Borrador" en preview staff; checklist pre-producción con legal Jeyjo.
- **[404 blog si staff activa antes de #33]** → Mitigation: `blogEnabled` default `false`; documentar en hub.
- **[Grid overflow mobile]** → Mitigation: omnicanal + tiendas col-span full en `<md`; tests visuales viewport 375px.
- **[Divergencia contacto SKAI vs system]** → Mitigation: single resolver compartido; test unitario precedencia.
- **[Payload caído en legal pages]** → Mitigation: ISR/cache 300s; fallback mensaje genérico 503 styled, no 500.

## Migration Plan

1. Desplegar CMS: global `footerSettings`, colección `sitePages`, seed legal/FAQ, extender `/api/system/config`.
2. Desplegar storefront: Footer refactor + rutas legal/faq.
3. Staff: revisar copy legal, subir badge UE, configurar redes, verificar teléfonos en system settings.
4. Rollback: revert deploy; footer vuelve a versión anterior (placeholders); páginas legal opcionales.

## Open Questions

1. ¿URL externa del programa UE (enlace obligatorio además de imagen)? → Propuesta: campo `euFundingUrl` opcional en `footerSettings`.
2. ¿Página `/legal/contacto` con formulario o solo datos de contacto? → Propuesta v1: datos + enlace mailto/WhatsApp; formulario fuera de scope.
3. ¿Incluir enlace LinkedIn corporativo Jeyjo en seed? → Depende marketing; campos vacíos ocultan iconos.
