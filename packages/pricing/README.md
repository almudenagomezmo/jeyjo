# @jeyjo/pricing

Motor de precios Jeyjo (RF-007): cadena de prioridad precio especial → oferta de grupo → P2 − descuento B2B → P1.

## Tests ↔ criterios de aceptación

| Test (Vitest) | Criterio |
|---------------|----------|
| `CA-PRECIOS-001: P1 for anonymous` | CA-PRECIOS-001 |
| `CA-PRECIOS-002: B2B P2 minus discount` | CA-PRECIOS-002 |
| `CA-PRECIOS-003: no stacking offer + B2B discount` | CA-PRECIOS-003 |
| `CA-PRECIOS-004: special price prevails` | CA-PRECIOS-004 |

## Scripts

```bash
pnpm --filter @jeyjo/pricing test
pnpm --filter @jeyjo/pricing test:coverage
```

## RNF-003 (latencia)

Smoke de 100 peticiones al endpoint storefront `POST /api/pricing/resolve` en staging; objetivo p95 &lt; 200 ms. Si la lectura Payload por SKU bloquea el presupuesto, documentar en Open Questions del cambio `price-engine-core`.
