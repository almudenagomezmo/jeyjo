/** Stub column headers for Avansuite ImportaciónArticulos.xlsx (see apps/cms/docs/avansuite-catalog-import.md). */
export const IMPORTACION_ARTICULOS_HEADERS = [
  'Referencia',
  'Descripcion',
  'PrecioP1',
  'PrecioP2',
  'IVA',
  'UnidadesEnvase',
  'CodigoEAN',
  'RefMayorista',
  'RefOEM',
  'CodigoProveedor',
  'Stock',
  'Categoria',
  'EstadoPublicacion',
  'MetaDescripcion',
  'UrlAmigable',
] as const

export type ImportacionArticulosHeader = (typeof IMPORTACION_ARTICULOS_HEADERS)[number]

export const COLUMN_ALIASES: Record<string, ImportacionArticulosHeader> = {
  referencia: 'Referencia',
  descripcion: 'Descripcion',
  descripción: 'Descripcion',
  preciop1: 'PrecioP1',
  'precio p1': 'PrecioP1',
  preciop2: 'PrecioP2',
  'precio p2': 'PrecioP2',
  iva: 'IVA',
  unidadesenvase: 'UnidadesEnvase',
  codigoean: 'CodigoEAN',
  ean: 'CodigoEAN',
  refmayorista: 'RefMayorista',
  refoem: 'RefOEM',
  codigoproveedor: 'CodigoProveedor',
  stock: 'Stock',
  categoria: 'Categoria',
  categoría: 'Categoria',
  estadopublicacion: 'EstadoPublicacion',
  metadescripcion: 'MetaDescripcion',
  urlamigable: 'UrlAmigable',
}
