# Jeyjo · Storefront (Next.js)

Tienda online de material de oficina y reciclaje **Jeyjo**, reconstruida como aplicación
**Next.js 15 (App Router) + React 19 + TypeScript estricto + Tailwind CSS v4**.

Este repositorio cubre el **núcleo B2C**: Home, listado por categoría/subcategoría (PLP) con
filtros, ficha de producto (PDP), búsqueda y carrito. El portal B2B, el checkout completo y la
autenticación quedan documentados en el [roadmap](#roadmap).

---

## Stack y decisiones de arquitectura

| Área            | Decisión                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| Framework       | Next.js 15, **App Router**, React Server Components por defecto              |
| Lenguaje        | TypeScript en modo `strict` + `noUncheckedIndexedAccess`                    |
| Estilos         | Tailwind CSS v4 con **tokens de diseño en CSS variables** (`@theme inline`) |
| Tema claro/osc. | Clase `.dark` en `<html>`, aplicada antes del paint para evitar parpadeo    |
| Estado cliente  | **Zustand** con `persist` (carrito, favoritos, preferencias de UI)          |
| Datos           | Capa mock tipada en `src/lib/data` (sustituible por un cliente de API/PIM)  |
| Iconos          | SVG propios e inline (sin dependencias de librerías de iconos)              |
| Imágenes        | `ProductGlyph` (placeholders SVG) — listo para cambiar a `next/image`       |

### Server vs Client Components

- Las **páginas** (`app/**/page.tsx`) son Server Components: resuelven datos y SEO
  (`generateMetadata`, `generateStaticParams`).
- La **interactividad** vive en islas cliente marcadas con `"use client"`: carrito, buscador con
  sugerencias, filtros del PLP, selector de cantidad, toggles de tema y de modo de precio.
- El catálogo es estático, por lo que las rutas de categoría y producto se **prerenderizan**
  (SSG) vía `generateStaticParams`.

### Regla de precios B2C / B2B

`src/lib/utils/price.ts` centraliza la lógica de precio dual:

- **B2C** → cifra grande **con IVA**, secundaria sin IVA.
- **B2B** → cifra grande **sin IVA** (base), secundaria con IVA.

El _toggle_ del header cambia el énfasis (`useUiStore`). En producción el modo se derivaría del
grupo del cliente autenticado.

---

## Puesta en marcha

Requisitos: **Node.js 18.18+** (recomendado 20+) y npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Otros scripts:

```bash
npm run build      # build de producción
npm run start      # sirve el build
npm run lint       # ESLint (next/core-web-vitals + typescript)
npm run typecheck  # tsc --noEmit
npm run format     # Prettier (+ orden de clases Tailwind)
```

---

## Estructura del proyecto

```
src/
├─ app/
│  ├─ layout.tsx              # Root layout: fuentes, TopBar, Header, Footer, MiniCart
│  ├─ globals.css             # Tailwind v4 + tokens (light/dark)
│  ├─ page.tsx                # Home
│  ├─ c/[category]/page.tsx   # PLP por categoría
│  ├─ c/[category]/[sub]/…    # PLP por subcategoría
│  ├─ p/[id]/page.tsx         # PDP (ficha de producto)
│  ├─ search/page.tsx         # Resultados de búsqueda
│  ├─ cart/page.tsx           # Carrito completo
│  ├─ cuenta/page.tsx         # Placeholder del área de cliente
│  └─ not-found.tsx           # 404
├─ components/
│  ├─ ui/                     # Design system: Button, Badge, Card, Input,
│  │                          # PriceTag, StockBadge, QtyStepper, icons, Logo…
│  ├─ layout/                 # Header, TopBar, Footer, SearchBar, MegaMenu, toggles
│  ├─ product/                # ProductCard, ProductGrid, ProductCatalog (filtros),
│  │                          # ProductBuyBox, ProductTabs
│  └─ cart/                   # MiniCart, AddToCartButton
└─ lib/
   ├─ types.ts                # Tipos de dominio
   ├─ data/                   # Catálogo mock (productos + categorías)
   ├─ store/                  # Zustand: cart, ui, wishlist
   ├─ hooks/                  # useHydrated
   ├─ cart.ts                 # Cálculo de totales/envío
   └─ utils/                  # price, format, search, cn
```

---

## Catálogo

`src/lib/data/products.ts` incluye las **referencias reales** facilitadas por Jeyjo, marcadas como
`bestseller` (BIC Cristal azul, Casio FX-85 SP CW, cartucho ARMOR Epson 29XL magenta, Navigator A4
100 g ×5 y bloc charol Liderpapel). El resto son productos coherentes (marcas/modelos reales) que
rellenan las facetas de cada categoría para la demo.

Para conectar un backend real, reimplementa las funciones de `src/lib/data/*` y
`src/lib/utils/search.ts` manteniendo sus firmas: la capa de UI no cambia.

---

## Sistema de diseño

Los tokens (color, radios, sombras, tipografía) se definen como CSS variables en `globals.css` y se
exponen a Tailwind con `@theme inline`, de modo que utilidades como `bg-surface`, `text-text-brand`,
`rounded-md` o `shadow-md` responden automáticamente al modo oscuro. La paleta deriva del manual
corporativo (verde `#22CE7A`, negro `#1C1B17`, navy `#3C4658`).

---

## Roadmap

Siguientes fases (presentes en el prototipo HTML original, fuera de este scaffold):

- **Checkout** de 1 paso con direcciones, recogida en tienda y pasarelas (Redsys/Bizum/PayPal).
- **Portal B2B**: dashboard, historial de pedidos con repetición, pedido rápido (Excel),
  tarifas pactadas, subusuarios con permisos, RMA, avisos de stock.
- **Auth**: login, registro B2C/B2B, recuperación y MFA.
- **Asistente EVA** con generación de borradores de pedido desde lenguaje natural.
- Integración real de catálogo (PIM), buscador (Qdrant/Typesense) y fotografía de producto.
