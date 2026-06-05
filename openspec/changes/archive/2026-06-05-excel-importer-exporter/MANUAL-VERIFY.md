# Manual verification — excel-importer-exporter

## Staging checklist (5.4)

1. Staff `catalogo` o `superadmin` autenticado con MFA.
2. Abrir `/admin/catalog-import`.
3. Descargar plantilla y validar cabeceras.
4. Subir fixture con 50 filas + referencia `9000000001`.
5. Confirmar resumen: 1 comodín, 0 errores bloqueantes.
6. Aplicar importación → mensaje de éxito con contadores.
7. Consultar `audit_log`: entrada `IMPORT_CATALOG_EXCEL` con `wildcards: 1`.
8. Storefront: búsqueda/catálogo no lista `9000000001`.
9. Exportar catálogo → archivo `.xlsx` descargable.
