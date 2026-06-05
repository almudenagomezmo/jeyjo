# Importación de catálogo desde Avansuite (ImportaciónArticulos.xlsx)

Parser implementado en `@jeyjo/erp-excel` y UI en `/admin/catalog-import` (cambio #29, US-15).

## Columnas del Excel (stub v1)

| Columna | Campo DTO / Payload | Obligatorio | Descripción |
|---------|---------------------|-------------|-------------|
| Referencia | `skuErp` | Sí | Referencia ERP del artículo |
| Descripcion | `shortDescription` | No | Descripción corta |
| PrecioP1 | `p1Price` | Sí* | Precio P1 (B2C) |
| PrecioP2 | `p2Price` | Sí* | Precio P2 (B2B) |
| IVA | `vatRate` | No | Tipo IVA (ej. 21) |
| UnidadesEnvase | `packUnit` | No | Unidades por envase |
| CodigoEAN | `ean` | No | EAN-8/EAN-13 con dígito de control válido |
| RefMayorista | `mainWholesaleRef` | No | Referencia mayorista |
| RefOEM | `oemRef` | No | Referencia OEM |
| CodigoProveedor | `supplierErpCode` | No | Código proveedor ERP |
| Stock | `erpStock` | No | Stock ERP |
| Categoria | — | No | Nombre categoría (resolución en apply; aviso si no existe) |
| EstadoPublicacion | — | Solo export | `published` / `draft` |
| MetaDescripcion | — | Solo export | Metadescripción PIM |
| UrlAmigable | — | Solo export | Slug del producto |

\* Al menos uno de `PrecioP1` o `PrecioP2` debe ser numérico por fila.

## Comodín (RF-006)

Referencias listadas en `ERP_WILDCARD_SKUS` (por defecto `9000000001`) se marcan `isWildcard=true` y quedan excluidas del catálogo público.

## Flujo admin

1. **Validar:** `POST /api/erp/catalog-import/parse` — sube `.xlsx`, persiste en Storage `erp-imports` (o `.data/erp-imports` en local) y devuelve resumen sin mutar Payload.
2. **Aplicar:** `POST /api/erp/catalog-import/apply` con `{ importId }` — ejecuta `ErpCatalogSyncService`, recalcula semáforo stock y encola `search_events`.
3. **Exportar:** `GET /api/erp/catalog-export` — descarga catálogo actual con columnas enriquecidas.
4. **Plantilla:** `GET /api/erp/catalog-import/template`

## Variables de entorno

```env
ERP_ADAPTER=excel                    # opcional; cron sync lee ERP_EXCEL_CATALOG_PATH
ERP_EXCEL_CATALOG_PATH=/path/file.xlsx
ERP_WILDCARD_SKUS=9000000001
```

En desarrollo sin Supabase Storage, los uploads se guardan en `apps/cms/.data/erp-imports/`.

## Open questions (Jeyjo)

1. Nombre exacto y orden de columnas del fichero real `ImportaciónArticulos.xlsx` de Avansuite.
2. ¿Columnas adicionales (familia, subfamilia, marca)?
3. ¿Importación debe crear/asignar categorías automáticamente si no existen?

## Verificación manual (staging)

- **CA-BACKEND-002:** Importar `ImportaciónArticulos_test.xlsx` con `9000000001` → no aparece en catálogo público storefront.
- **US-15 CA5:** Tras apply, `audit_log` contiene `IMPORT_CATALOG_EXCEL` con contadores.
