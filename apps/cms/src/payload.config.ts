import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Suppliers } from '@/collections/Suppliers'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { Home } from '@/globals/Home'
import { PaymentSettings } from '@/globals/PaymentSettings'
import { auditLogEndpoint } from '@/endpoints/audit-log'
import { bulkSeoTemplateEndpoint } from '@/endpoints/bulk-seo-template'
import { pendingCustomersEndpoint } from '@/endpoints/pending-customers'
import { pimHealthEndpoint } from '@/endpoints/pim-health'
import { ordersOmsEndpoints } from '@/endpoints/orders-oms'
import { plugins } from './plugins'
import { ensureCollection } from '@/lib/qdrant'
import { qdrantCollections } from '@/lib/qdrant-collections'
import {nodemailerAdapter} from "@payloadcms/email-nodemailer";

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3001')

const corsOrigins = [serverURL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean)

const databaseUrl = process.env.DATABASE_URL || ''
const isSupabase =
  databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')
/** pg v8 trata sslmode=require como verify-full; uselibpqcompat evita fallos de certificado con Supabase. */
const connectionString =
  isSupabase && !databaseUrl.includes('sslmode=')
    ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}uselibpqcompat=true&sslmode=require`
    : databaseUrl

/** Mailpit solo si SMTP_USE_MAILPIT=true; si no, jsonTransport (sin servidor SMTP). */
function getEmailTransportOptions() {
  if (process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
    return {
      host: process.env.RESEND_SMTP_HOST,
      port: Number(process.env.RESEND_SMTP_PORT),
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
      secure: false,
    }
  }
  if (process.env.SMTP_USE_MAILPIT === 'true') {
    return { host: 'localhost', port: 1025, secure: false, ignoreTLS: true }
  }
  return { jsonTransport: true }
}

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/MfaGate#MfaGate'],
      views: {
        auditLog: {
          Component: '@/components/AuditLogView#AuditLogView',
          path: '/audit-log',
        },
        pendingCustomers: {
          Component: '@/components/PendingCustomersView#PendingCustomersView',
          path: '/pending-customers',
        },
        pimHealth: {
          Component: '@/components/PimHealthView#PimHealthView',
          path: '/pim-health',
        },
        bulkSeoTemplate: {
          Component: '@/components/BulkSeoTemplateView#BulkSeoTemplateView',
          path: '/bulk-seo-template',
        },
        omsInbox: {
          Component: '@/components/OmsInboxView#OmsInboxView',
          path: '/oms',
        },
        omsEva: {
          Component: '@/components/EvaOrdersQueueView#EvaOrdersQueueView',
          path: '/oms/eva',
        },
      },
    },
    user: Users.slug,
  },
  collections: [Users, Pages, Categories, Suppliers, Media],
  cors: corsOrigins,
  csrf: corsOrigins,
  db: postgresAdapter({
    pool: {
      connectionString,
      ...(isSupabase
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  email: nodemailerAdapter({
    transportOptions: getEmailTransportOptions(),
    defaultFromName: process.env.RESEND_FROM_NAME || 'Jeyjo',
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@tudominio.com',
  }),
  endpoints: [
    auditLogEndpoint,
    pendingCustomersEndpoint,
    bulkSeoTemplateEndpoint,
    pimHealthEndpoint,
    ...ordersOmsEndpoints,
  ],
  globals: [Header, Footer, Home, PaymentSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async () => {
    for (const col of qdrantCollections) {
      try {
        await ensureCollection(col.name, col.vectorSize)
      } catch {
        console.warn(`[Qdrant] No se pudo crear la colección "${col.name}" — Qdrant no está disponible?`)
      }
    }
  },
})
