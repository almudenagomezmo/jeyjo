import type { ErpDocumentType } from '@jeyjo/erp-ports'

const PRIVATE_DOCUMENTS_BUCKET = 'private-documents'
const SIGNED_URL_TTL_SECONDS = 120

export function buildDocumentStoragePath(
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
): string {
  return `${customerId}/${documentType}/${documentId}.pdf`
}

export function buildDocumentMetaPath(storagePath: string): string {
  return `${storagePath}.meta.json`
}

export function assertCustomerStoragePrefix(customerId: string, storagePath: string): void {
  const prefix = `${customerId}/`
  if (!storagePath.startsWith(prefix)) {
    throw new Error('Cross-customer storage path rejected')
  }
}

export type DocumentCacheMeta = {
  erpUpdatedAt?: string
  storedAt: string
}

export type ResolveCachedPdfInput = {
  customerId: string
  documentType: ErpDocumentType
  documentId: string
  erpUpdatedAt?: string
  fetchFromErp: () => Promise<{ bytes: Uint8Array; fileName: string }>
}

export type ResolveCachedPdfResult = {
  bytes: Uint8Array
  fileName: string
  fromCache: boolean
}

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>
      upload: (
        path: string,
        body: Uint8Array,
        opts: { contentType: string; upsert: boolean },
      ) => Promise<{ error: { message: string } | null }>
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>
    }
  }
}

export async function resolveCachedDocumentPdf(
  admin: StorageClient,
  input: ResolveCachedPdfInput,
): Promise<ResolveCachedPdfResult> {
  const storagePath = buildDocumentStoragePath(input.customerId, input.documentType, input.documentId)
  assertCustomerStoragePrefix(input.customerId, storagePath)

  const metaPath = buildDocumentMetaPath(storagePath)
  const bucket = admin.storage.from(PRIVATE_DOCUMENTS_BUCKET)

  const [pdfDownload, metaDownload] = await Promise.all([
    bucket.download(storagePath),
    bucket.download(metaPath),
  ])

  let cachedMeta: DocumentCacheMeta | null = null
  if (metaDownload.data) {
    try {
      cachedMeta = JSON.parse(await metaDownload.data.text()) as DocumentCacheMeta
    } catch {
      cachedMeta = null
    }
  }

  const erpTs = input.erpUpdatedAt ? Date.parse(input.erpUpdatedAt) : null
  const cachedTs = cachedMeta?.erpUpdatedAt ? Date.parse(cachedMeta.erpUpdatedAt) : null
  const cacheValid =
    pdfDownload.data &&
    (!erpTs || !cachedTs || cachedTs >= erpTs)

  if (cacheValid && pdfDownload.data) {
    const buffer = new Uint8Array(await pdfDownload.data.arrayBuffer())
    const fileName = storagePath.split('/').pop()?.replace('.pdf', '') ?? 'documento.pdf'
    return { bytes: buffer, fileName: `${fileName}.pdf`, fromCache: true }
  }

  const fresh = await input.fetchFromErp()
  await bucket.upload(storagePath, fresh.bytes, {
    contentType: 'application/pdf',
    upsert: true,
  })

  const meta: DocumentCacheMeta = {
    erpUpdatedAt: input.erpUpdatedAt,
    storedAt: new Date().toISOString(),
  }
  await bucket.upload(metaPath, new TextEncoder().encode(JSON.stringify(meta)), {
    contentType: 'application/json',
    upsert: true,
  })

  return { bytes: fresh.bytes, fileName: fresh.fileName, fromCache: false }
}

export async function createSignedDocumentUrl(
  admin: StorageClient,
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
): Promise<string | null> {
  const storagePath = buildDocumentStoragePath(customerId, documentType, documentId)
  assertCustomerStoragePrefix(customerId, storagePath)
  const { data, error } = await admin.storage
    .from(PRIVATE_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export { PRIVATE_DOCUMENTS_BUCKET, SIGNED_URL_TTL_SECONDS }
