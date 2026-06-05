import type { ErpForm347Summary } from '../../ports/documents-reader.js'

export const STUB_FORM347_BY_CUSTOMER: Record<string, Record<number, ErpForm347Summary>> = {
  'B2B-EMPRESA1': {
    2024: {
      fiscalYear: 2024,
      totalOperationsAmount: 12500.75,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
    },
    2025: {
      fiscalYear: 2025,
      totalOperationsAmount: 18240.0,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
    },
  },
  'B2B-EMPRESA2': {
    2025: {
      fiscalYear: 2025,
      totalOperationsAmount: 3200.0,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA2',
    },
  },
}
