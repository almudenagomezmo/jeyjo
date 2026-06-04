# RF-024 / US-16 manual verification (staging)

## PDP

- [ ] Product with **provider URL only**: gallery shows provider image; View Source `og:image` matches provider (or meta.image if set).
- [ ] Product with **ownImage + provider**: gallery shows own image; `og:image` uses `meta.image` when set, else own.
- [ ] Product with **no images**: gallery shows glyph placeholder; no broken `og:image` tag.

## PLP / suggest

- [ ] PLP card shows `<img src>` for provider-only product.
- [ ] `POST /api/search/suggest` returns `imageUrl` for product with `ownImage`.

## CMS admin

- [ ] Marketing tab vs SEO Preview tab show distinct image help text.
- [ ] `/admin/bulk-seo-template`: bulk on 2 products sets `meta.description`; audit log entries exist.
- [ ] `/admin/pim-health`: product missing catalog image appears under "Sin imagen de catálogo".
