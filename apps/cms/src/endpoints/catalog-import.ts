import { parseImportacionArticulos, serializeImportacionArticulosTemplate } from '@jeyjo/erp-excel'
import { APIError, type Endpoint } from 'payload'

import { persistImportFile } from '@/erp/catalog-import/storage'
import { runExcelCatalogImportApply } from '@/erp/catalog-import/runExcelImport'
import { buildCatalogExportBuffer } from '@/erp/catalog-import/export-catalog'
import { canAccessCatalogImport } from '@/lib/catalog-import-access'
import { sourceIpFromHeaders, writeAuditLog } from '@/lib/supabase-server'

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

async function readUploadBuffer(req: Parameters<NonNullable<Endpoint['handler']>>[0]): Promise<Buffer> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData?.()
    const file = form?.get('file')
    if (!file || typeof file === 'string') {
      throw new APIError('Missing file field', 400)
    }
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  const raw = await req.arrayBuffer?.()
  if (!raw || raw.byteLength === 0) {
    throw new APIError('Empty request body', 400)
  }
  return Buffer.from(raw)
}

function assertXlsx(buffer: Buffer): void {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new APIError('File exceeds 15 MB limit', 400)
  }
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b
  if (!isZip) {
    throw new APIError('Only .xlsx files are supported', 400)
  }
}

export const catalogImportParseEndpoint: Endpoint = {
  path: '/erp/catalog-import/parse',
  method: 'post',
  handler: async (req) => {
    if (!canAccessCatalogImport(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const buffer = await readUploadBuffer(req)
    assertXlsx(buffer)

    const parsed = await parseImportacionArticulos(buffer)
    const importId = await persistImportFile(buffer)

    const blockingErrors = parsed.errors.filter((e) => e.blocking)

    return Response.json({
      importId,
      summary: parsed.summary,
      wildcards: parsed.wildcards,
      errors: parsed.errors,
      canApply: blockingErrors.length === 0 && parsed.products.length > 0,
      productCount: parsed.products.length,
      supplierCount: parsed.suppliers.length,
    })
  },
}

export const catalogImportApplyEndpoint: Endpoint = {
  path: '/erp/catalog-import/apply',
  method: 'post',
  handler: async (req) => {
    if (!canAccessCatalogImport(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    let body: { importId?: string } = {}
    try {
      body = (await req.json?.()) as { importId?: string }
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const importId = body.importId?.trim()
    if (!importId) {
      throw new APIError('importId is required', 400)
    }

    const actorName = req.user?.email ?? String(req.user?.id ?? 'staff')
    const result = await runExcelCatalogImportApply({
      payload: req.payload,
      req,
      importId,
      actorName,
      actorId: req.user?.id,
    })

    return Response.json(result)
  },
}

export const catalogExportEndpoint: Endpoint = {
  path: '/erp/catalog-export',
  method: 'get',
  handler: async (req) => {
    if (!canAccessCatalogImport(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const buffer = await buildCatalogExportBuffer(req.payload, req)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `ImportaciónArticulos_export_${date}.xlsx`

    await writeAuditLog({
      actorId: req.user?.id,
      actorName: req.user?.email ?? String(req.user?.id ?? 'staff'),
      entityType: 'catalog_import',
      action: 'EXPORT_CATALOG_EXCEL',
      metadata: {
        filename,
        byteLength: buffer.byteLength,
      },
      sourceIp: sourceIpFromHeaders(req.headers),
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  },
}

export const catalogImportTemplateEndpoint: Endpoint = {
  path: '/erp/catalog-import/template',
  method: 'get',
  handler: async (req) => {
    if (!canAccessCatalogImport(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const buffer = await serializeImportacionArticulosTemplate()

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="plantilla-importacion-articulos.xlsx"',
      },
    })
  },
}

export const catalogImportEndpoints = [
  catalogImportParseEndpoint,
  catalogImportApplyEndpoint,
  catalogExportEndpoint,
  catalogImportTemplateEndpoint,
]
