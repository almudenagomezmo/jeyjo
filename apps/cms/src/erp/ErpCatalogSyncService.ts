import type { ErpCatalogReader, ErpProductDto, ErpSupplierDto } from '@jeyjo/erp-ports'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import { mapErpProductDtoToPayload } from '@/erp/mappers/product'
import { mapErpSupplierDtoToPayload } from '@/erp/mappers/supplier'
import type { Product } from '@/payload-types'

export type ErpCatalogSyncResult = {
  productsUpdated: number
  suppliersUpdated: number
  errors: string[]
}

export class ErpCatalogSyncService {
  constructor(
    private readonly payload: Payload,
    private readonly reader: ErpCatalogReader,
  ) {}

  async syncAllFromReader(req?: PayloadRequest): Promise<ErpCatalogSyncResult> {
    const result: ErpCatalogSyncResult = {
      productsUpdated: 0,
      suppliersUpdated: 0,
      errors: [],
    }

    let supplierCursor: string | null = null
    do {
      const page = await this.reader.listSuppliers({ limit: 100, cursor: supplierCursor })
      for (const dto of page.items) {
        try {
          await this.applySupplier(dto, req)
          result.suppliersUpdated += 1
        } catch (e) {
          result.errors.push(`supplier ${dto.erpCode}: ${formatError(e)}`)
        }
      }
      supplierCursor = page.hasMore ? page.nextCursor : null
    } while (supplierCursor)

    let productCursor: string | null = null
    do {
      const page = await this.reader.listProducts({ limit: 100, cursor: productCursor })
      for (const dto of page.items) {
        try {
          const applied = await this.applyProduct(dto, req)
          if (applied) {
            result.productsUpdated += 1
          }
        } catch (e) {
          result.errors.push(`product ${dto.skuErp}: ${formatError(e)}`)
        }
      }
      productCursor = page.hasMore ? page.nextCursor : null
    } while (productCursor)

    return result
  }

  async applyProduct(dto: ErpProductDto, req?: PayloadRequest): Promise<boolean> {
    const syncReq = await this.erpSyncReq(req)
    const syncAt = new Date().toISOString()
    const erpData = mapErpProductDtoToPayload(dto, syncAt)

    const existing = await this.payload.find({
      collection: 'products',
      where: { skuErp: { equals: dto.skuErp } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req: syncReq,
    })

    const supplierId = dto.supplierErpCode
      ? await this.resolveSupplierId(dto.supplierErpCode, syncReq)
      : undefined

    const data: Partial<Product> = {
      ...(erpData as Partial<Product>),
      ...(supplierId != null ? { supplier: supplierId as Product['supplier'] } : {}),
    }

    if (existing.docs[0]) {
      await this.payload.update({
        collection: 'products',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        req: syncReq,
      })
      return true
    }

    const title =
      dto.shortDescription?.trim().slice(0, 200) || `Producto ${dto.skuErp}`
    const slug = slugFromSkuErp(dto.skuErp)

    await this.payload.create({
      collection: 'products',
      data: {
        title,
        slug,
        _status: 'draft',
        ...(data as Partial<Product>),
        enableVariants: false,
        priceInUSDEnabled: false,
      },
      overrideAccess: true,
      req: syncReq,
    })
    return true
  }

  async applySupplier(dto: ErpSupplierDto, req?: PayloadRequest): Promise<string> {
    const syncReq = await this.erpSyncReq(req)
    const data = mapErpSupplierDtoToPayload(dto)

    const existing = await this.payload.find({
      collection: 'suppliers',
      where: { erpCode: { equals: dto.erpCode } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req: syncReq,
    })

    if (existing.docs[0]) {
      await this.payload.update({
        collection: 'suppliers',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        req: syncReq,
      })
      return String(existing.docs[0].id)
    }

    const created = await this.payload.create({
      collection: 'suppliers',
      data,
      overrideAccess: true,
      req: syncReq,
    })
    return String(created.id)
  }

  private async erpSyncReq(req?: PayloadRequest): Promise<PayloadRequest> {
    if (req) {
      req.context = { ...req.context, erpSync: true }
      return req
    }
    const localReq = await createLocalReq({}, this.payload)
    localReq.context = { ...localReq.context, erpSync: true }
    return localReq
  }

  private async resolveSupplierId(
    erpCode: string,
    req: PayloadRequest,
  ): Promise<string | number | undefined> {
    const found = await this.payload.find({
      collection: 'suppliers',
      where: { erpCode: { equals: erpCode } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    return found.docs[0]?.id
  }
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function slugFromSkuErp(skuErp: string): string {
  const base = skuErp
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base.length > 0 ? base : 'producto-erp'
}
