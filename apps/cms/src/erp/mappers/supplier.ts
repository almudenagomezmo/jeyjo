import type { ErpSupplierDto } from '@jeyjo/erp-ports'

export type ErpSupplierPayloadFields = {
  erpCode: string
  name: string
  type: ErpSupplierDto['type']
  baseImageUrl?: string | null
}

export function mapErpSupplierDtoToPayload(dto: ErpSupplierDto): ErpSupplierPayloadFields {
  return {
    erpCode: dto.erpCode,
    name: dto.name,
    type: dto.type,
    baseImageUrl: dto.baseImageUrl ?? undefined,
  }
}
