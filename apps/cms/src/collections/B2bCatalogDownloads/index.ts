import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import { createAuditHooks } from '@/hooks/auditLogHooks'

const DOCUMENT_TYPE_OPTIONS = [
  { label: 'Catálogo', value: 'catalog' },
  { label: 'Revista de ofertas', value: 'offer_magazine' },
  { label: 'Otro', value: 'other' },
]

const CUSTOMER_GROUP_OPTIONS = [
  { label: 'Empresa B2B', value: '2' },
  { label: 'Colegios', value: '3' },
  { label: 'Concursos públicos', value: '4' },
]

const MAX_PDF_BYTES = 25 * 1024 * 1024

const catalogDownloadsAuditHooks = createAuditHooks({ collection: 'b2b-catalog-downloads' })

function toDateKey(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return null
}

export const B2bCatalogDownloads: CollectionConfig = {
  slug: 'b2b-catalog-downloads',
  labels: {
    singular: 'Descarga B2B',
    plural: 'Descargas B2B',
  },
  access: {
    create: staffCreateAccess('b2b-catalog-downloads'),
    read: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return true
      return staffReadAccess('b2b-catalog-downloads')({ req })
    },
    update: staffUpdateAccess('b2b-catalog-downloads'),
    delete: staffDeleteAccess('b2b-catalog-downloads'),
  },
  admin: {
    group: 'Marketing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'validFrom', 'validUntil', 'published'],
    hidden: ({ user }) => isCollectionHidden(user, 'b2b-catalog-downloads'),
    description: 'Catálogos PDF y revistas de ofertas visibles en /intranet/descargas.',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data
        const from = toDateKey(data.validFrom)
        const until = toDateKey(data.validUntil)
        if (from && until && until < from) {
          throw new Error('La fecha de fin debe ser igual o posterior a la de inicio.')
        }
        return data
      },
    ],
    afterChange: [...catalogDownloadsAuditHooks.afterChange],
    afterDelete: [...catalogDownloadsAuditHooks.afterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
      maxLength: 500,
    },
    {
      name: 'documentType',
      type: 'select',
      label: 'Tipo',
      required: true,
      defaultValue: 'catalog',
      options: DOCUMENT_TYPE_OPTIONS,
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Archivo PDF',
      required: true,
      filterOptions: {
        mimeType: { contains: 'pdf' },
      },
      admin: {
        description: 'Solo PDF, máximo 25 MB.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Portada (opcional)',
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    {
      name: 'validFrom',
      type: 'date',
      label: 'Vigente desde',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'validUntil',
      type: 'date',
      label: 'Vigente hasta',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'customerGroups',
      type: 'select',
      label: 'Grupos de cliente',
      hasMany: true,
      options: CUSTOMER_GROUP_OPTIONS,
      admin: {
        description: 'Vacío = visible para todos los grupos B2B (2, 3 y 4).',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}

export function assertPdfUploadSize(size: number | undefined): void {
  if (size != null && size > MAX_PDF_BYTES) {
    throw new Error('El PDF no puede superar 25 MB.')
  }
}
