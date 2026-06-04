import type { ErpProductDto, ErpSupplierDto } from '../../types/dtos.js'

/** Aligned with `apps/cms/src/endpoints/seed/jeyjo-catalog.ts` SKUs. */
export const STUB_SAMPLE_SUPPLIERS: ErpSupplierDto[] = [
  {
    erpCode: 'DIST-001',
    name: 'Distrisantiago Demo',
    type: 'distributor',
    baseImageUrl: 'https://example.com/distrisantiago/',
  },
]

export const STUB_SAMPLE_PRODUCTS: ErpProductDto[] = [
  {
    skuErp: 'ERP-GRF-001',
    mainWholesaleRef: 'DS-12345',
    shortDescription: 'Grifo monomando para lavabo, acabado cromado.',
    p1Price: 45.9,
    p2Price: 39.5,
    vatRate: 21,
    packUnit: 1,
    erpStock: 120,
    supplierErpCode: 'DIST-001',
    isWildcard: false,
    allowOrderWithoutStock: false,
  },
  {
    skuErp: 'ERP-PVC-032',
    shortDescription: 'Manguito de unión PVC diametro 32mm.',
    p1Price: 1.2,
    p2Price: 1.05,
    vatRate: 21,
    packUnit: 1,
    erpStock: 500,
    supplierErpCode: 'DIST-001',
    isWildcard: false,
    allowOrderWithoutStock: true,
  },
]
