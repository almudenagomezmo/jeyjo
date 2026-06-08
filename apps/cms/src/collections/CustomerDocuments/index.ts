import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { syncCustomerDocumentPdf } from '@/collections/CustomerDocuments/pdf-storage'
import { notifyInvoiceDocumentCreated } from '@/collections/CustomerDocuments/invoice-notification'

const DOCUMENT_TYPES = [
  { label: 'Factura', value: 'invoice' },
  { label: 'Albarán', value: 'delivery_note' },
  { label: 'Vencimiento', value: 'due_payment' },
  { label: 'Cifra 347', value: 'form_347' },
  { label: 'Presupuesto ERP', value: 'erp_quote' },
] as const

const auditHooks = createAuditHooks({ collection: 'customer-documents' })

export const CustomerDocuments: CollectionConfig = {
  slug: 'customer-documents',
  labels: {
    singular: 'Documento cliente',
    plural: 'Documentos cliente',
  },
  access: {
    create: staffCreateAccess('customer-documents'),
    read: staffReadAccess('customer-documents'),
    update: staffUpdateAccess('customer-documents'),
    delete: staffDeleteAccess('customer-documents'),
  },
  admin: {
    group: 'Clientes B2B',
    useAsTitle: 'documentNumber',
    defaultColumns: ['documentNumber', 'documentType', 'customerId', 'issuedAt'],
    hidden: ({ user }) => isCollectionHidden(user, 'customer-documents'),
    description: 'Facturas, albaranes y documentos financieros B2B subidos por administración.',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, id }) => {
        if (!data || typeof data !== 'object') return data
        const customerId = String(data.customerId ?? '').trim()
        const documentNumber = String(data.documentNumber ?? '').trim()
        const documentType = data.documentType

        if (!customerId) throw new Error('customerId es obligatorio')
        if (!documentNumber) throw new Error('documentNumber es obligatorio')
        if (!documentType) throw new Error('documentType es obligatorio')

        if (documentType === 'due_payment') {
          if (data.outstandingAmount == null) throw new Error('outstandingAmount es obligatorio')
          if (!data.dueDate) throw new Error('dueDate es obligatorio para vencimientos')
        }

        const existing = await req.payload.find({
          collection: 'customer-documents',
          where: {
            and: [
              { customerId: { equals: customerId } },
              { documentNumber: { equals: documentNumber } },
              { documentType: { equals: documentType } },
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
          req,
        })
        const conflict = existing.docs[0]
        if (conflict && String(conflict.id) !== String(id ?? '')) {
          throw new Error('Ya existe un documento con ese número para este cliente y tipo')
        }

        return data
      },
    ],
    afterChange: [
      async (args) => {
        await syncCustomerDocumentPdf(args)
        await notifyInvoiceDocumentCreated(args)
        return args.doc
      },
      ...auditHooks.afterChange,
    ],
    afterDelete: [...auditHooks.afterDelete],
  },
  fields: [
    {
      name: 'customerId',
      type: 'text',
      label: 'ID cliente (UUID Supabase)',
      required: true,
      index: true,
    },
    {
      name: 'documentType',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [...DOCUMENT_TYPES],
      index: true,
    },
    {
      name: 'documentNumber',
      type: 'text',
      label: 'Número documento',
      required: true,
    },
    {
      name: 'issuedAt',
      type: 'date',
      label: 'Fecha emisión',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'netAmount',
          type: 'number',
          label: 'Importe neto',
          admin: { step: 0.01 },
        },
        {
          name: 'grossAmount',
          type: 'number',
          label: 'Importe bruto',
          admin: { step: 0.01 },
        },
      ],
    },
    {
      name: 'dueDate',
      type: 'date',
      label: 'Fecha vencimiento',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        condition: (_, siblingData) => siblingData?.documentType === 'due_payment',
      },
    },
    {
      name: 'outstandingAmount',
      type: 'number',
      label: 'Importe pendiente',
      admin: {
        step: 0.01,
        condition: (_, siblingData) => siblingData?.documentType === 'due_payment',
      },
    },
    {
      name: 'status',
      type: 'text',
      label: 'Estado (opcional)',
    },
    {
      name: 'pdfFile',
      type: 'upload',
      label: 'PDF',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'storagePath',
      type: 'text',
      label: 'Ruta Storage',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'fiscalYear',
      type: 'number',
      label: 'Año fiscal (347)',
      admin: {
        condition: (_, siblingData) => siblingData?.documentType === 'form_347',
      },
    },
    {
      name: 'validUntil',
      type: 'date',
      label: 'Válido hasta',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        condition: (_, siblingData) => siblingData?.documentType === 'erp_quote',
      },
    },
  ],
}
