## Why

El alcance **§1.12** exige un **pie de página completo** (contacto omnicanal, tiendas físicas, enlaces legales, redes, blog, newsletter, proyecto UE, FAQ, métodos de pago). Tras **#9** (shell), **#32** (widget EVA), **#39** (newsletter) y **#42** (contacto/tiendas en `systemSettings`), el `Footer.tsx` actual solo muestra catálogo, columnas estáticas con enlaces `#`, teléfono/email básicos, newsletter y copyright genérico. Falta cerrar el gap legal y de confianza antes del go-live: omnicanal visible (WhatsApp, horarios), tiendas Alfaro/Rincón, rutas reales de ayuda/legal, redes sociales, badge UE y entrada FAQ. Es el cambio **#40** del ROADMAP; dependencias **#9** y **#32** completadas.

## What Changes

- **Zona omnicanal en footer:** bloque destacado con teléfono (`tel:`), email (`mailto:`), WhatsApp (`wa.me` o enlace configurado), horario de atención (desde `skaiSettings.businessHours` con fallback `systemSettings`) y CTA EVA coherente con **US-22** CA3.
- **Nuestras tiendas:** mostrar nombre y dirección de Alfaro y Rincón de Soto desde `GET /api/system/config` (ya persistidos en **#42**).
- **Enlaces legales y ayuda con rutas reales:** sustituir `#` por páginas públicas (`/legal/*`, `/ayuda/*`) con contenido editable en CMS; columnas "Comprar en Jeyjo" y "Ayuda" apuntan a envíos, devoluciones/RMA, formas de pago, B2B, presupuesto, cuenta, búsqueda, privacidad/cookies, FAQ y contacto.
- **Redes sociales:** iconos/enlaces configurables (Facebook, Instagram, LinkedIn, YouTube) desde global CMS `footerSettings`.
- **Proyecto financiado UE:** franja o badge con imagen/copy configurable (obligatorio legal para subvenciones).
- **Blog en footer:** enlace a `/blog` cuando esté habilitado en config (preparado para **#33**; oculto por defecto hasta que exista el frontend de blog).
- **Barra inferior:** copyright con CIF legal, métodos de pago con iconos accesibles (texto existente + SVG/monogramas), enlaces legales compactos (aviso legal, privacidad, cookies).
- **Global CMS `footerSettings` + extensión DTO:** social URLs, toggles de secciones, copy UE, slug blog, textos FAQ; hub en `/admin/system-config`.
- **Páginas legales/FAQ en storefront:** rutas App Router `(shop)/legal/[slug]` y `/ayuda/faq` renderizando contenido Payload colección `sitePages` (Lexical) con SEO básico.
- **Tests y checklist** alcance §1.12 / **US-22** CA3 (contacto humano coherente footer ↔ widget EVA).

## Capabilities

### New Capabilities

- `storefront-footer-omnichannel`: UI del pie completo §1.12 — omnicanal, tiendas, redes, UE, métodos de pago, integración con newsletter existente.
- `cms-footer-settings`: Global Payload `footerSettings`, mapeo en API pública y edición staff vía hub de configuración.
- `storefront-legal-pages`: Páginas públicas legales/FAQ servidas desde CMS con layout shell y metadatos.

### Modified Capabilities

- `storefront-app-shell`: Requisitos de footer ampliados más allá del bloque newsletter (§1.12 completo).
- `storefront-shell-navigation`: Enlaces de footer SHALL usar rutas reales; nueva columna/bloque omnicanal y tiendas.

## Impact

- `apps/storefront/src/components/layout/Footer.tsx` — refactor en subcomponentes (`FooterOmnichannel`, `FooterStores`, `FooterSocial`, `FooterLegalBar`, `FooterEuBadge`).
- `apps/storefront/src/lib/footer/**` — fetch config, tipos, helpers WhatsApp/maps.
- `apps/storefront/src/app/(shop)/legal/[slug]/page.tsx`, `apps/storefront/src/app/(shop)/ayuda/faq/page.tsx` — páginas CMS.
- `apps/cms/src/globals/FooterSettings.ts`, `apps/cms/src/collections/SitePages/` — contenido legal/FAQ editable.
- `apps/cms/src/lib/system-config/map-dto.ts` — sección `footer` en `SystemConfigDto`.
- `apps/cms/src/components/SystemConfigHubView/` — enlace a footer settings.
- Reutiliza contacto/tiendas de **#42**, horarios EVA de **#32** (`skaiSettings`), newsletter de **#39**; alinea contacto footer ↔ fallback widget EVA.
- Cumple alcance **§1.12**; desbloquea confianza legal pre-go-live; no duplica widget EVA (**#32**).

## Non-Goals

- **Blog corporativo completo** (**#33**): solo enlace condicional en footer; no colección `posts` ni listado de artículos.
- **Búsqueda por voz** en EVA — post-EVA explícito en ROADMAP.
- **Centro de ayuda/tickets** integrado — v1 FAQ estática CMS + enlace contacto; sin Zendesk/Freshdesk.
- **Mapas embebidos** Google Maps en footer — v1 dirección texto + enlace externo opcional.
- **i18n** del footer — español único v1.
- **Footer en portal B2B** (`/cuenta/empresa/*`, `/intranet/*`) — sigue oculto per specs existentes.
- **Rediseño visual** del shell — extender grid jeyjo-next, no nuevo design system.

## Assumptions

- Slugs legales v1: `aviso-legal`, `privacidad`, `cookies`, `condiciones-compra`, `envios`, `devoluciones`, `formas-pago`; seed en CMS con copy placeholder revisable por legal.
- WhatsApp footer usa mismo número que `systemSettings.whatsapp` / fallback SKAI.
- Horario footer: `skaiSettings.businessHours` si no vacío, si no texto default "L-V 9:00–18:00".
- Badge UE: imagen PNG/SVG en Payload Media + alt text obligatorio.
- Blog link oculto hasta `footerSettings.blogEnabled=true` (staff activa tras **#33**).
