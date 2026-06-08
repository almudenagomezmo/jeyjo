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

import { Coupons } from '@/collections/Coupons'
import { Categories } from '@/collections/Categories'
import { Quotes } from '@/collections/Quotes'
import { B2bCatalogDownloads } from '@/collections/B2bCatalogDownloads'
import { CustomerDocuments } from '@/collections/CustomerDocuments'
import { GroupOffers } from '@/collections/GroupOffers'
import { SpecialPrices } from '@/collections/SpecialPrices'
import { RmaIncidents } from '@/collections/RmaIncidents'
import { ProductReviews } from '@/collections/ProductReviews'
import { Media } from '@/collections/Media'
import { Brands } from '@/collections/Brands'
import { Suppliers } from '@/collections/Suppliers'
import { Users } from '@/collections/Users'
import { Home } from '@/globals/Home'
import { MarketingSettings } from '@/globals/MarketingSettings'
import { NewsletterSettings } from '@/globals/NewsletterSettings'
import { PaymentSettings } from '@/globals/PaymentSettings'
import { SkaiSettings } from '@/globals/SkaiSettings'
import { AnalyticsSettings } from '@/globals/AnalyticsSettings'
import { SystemSettings } from '@/globals/SystemSettings'
import { SYSTEM_SETTINGS_SEED } from '@/lib/system-config/defaults'
import { auditLogEndpoint } from '@/endpoints/audit-log'
import { bulkSeoTemplateEndpoint } from '@/endpoints/bulk-seo-template'
import { customersAdminEndpoints } from '@/endpoints/customers-admin'
import { dashboardSummaryEndpoint } from '@/endpoints/dashboard-summary'
import { pimHealthEndpoint } from '@/endpoints/pim-health'
import { catalogImportEndpoints } from '@/endpoints/catalog-import'
import { customerDocumentsEndpoints } from '@/endpoints/customer-documents'
import {
  evaContextEndpoint,
  evaOrdersWebhookEndpoint,
  skaiStatusEndpoint,
  skaiTestTokenEndpoint,
} from '@/endpoints/eva'
import {
  analyticsStatusEndpoint,
  analyticsStatusUpdateEndpoint,
} from '@/endpoints/analytics-status'
import { newsletterEndpoints } from '@/endpoints/newsletter'
import { preloadExcelAdapter } from '@/erp/registry'
import { plugins } from './plugins'
import { ensureCollection } from '@/lib/qdrant'
import { qdrantCollections } from '@/lib/qdrant-collections'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { getEmailTransportOptions } from '@/lib/email/mailpit'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3001')

const corsOrigins = [serverURL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean)

function appendQueryParam(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${key}=${value}`
}

/**
 * Supabase session pooler (:5432) caps concurrent clients (~15). Payload admin
 * (form-state + save + document locks) exhausts tiny pg pools in dev.
 * Transaction pooler (:6543) tolerates more parallel queries from Next HMR.
 */
function resolveSupabaseConnectionString(raw: string): string {
  let url = raw.trim()
  if (!url) return url

  const preferSession = process.env.PAYLOAD_USE_SESSION_POOLER === 'true'
  const useTxPooler =
    !preferSession &&
    (process.env.PAYLOAD_USE_TX_POOLER === 'true' ||
      (process.env.NODE_ENV === 'development' &&
        /pooler\.supabase\.com:5432/i.test(url)))

  if (useTxPooler) {
    url = url.replace(/pooler\.supabase\.com:5432/i, 'pooler.supabase.com:6543')
    url = appendQueryParam(url, 'pgbouncer', 'true')
  }

  if (!url.includes('sslmode=')) {
    url = appendQueryParam(url, 'uselibpqcompat', 'true')
    url = appendQueryParam(url, 'sslmode', 'require')
  }

  return url
}

const databaseUrl = process.env.DATABASE_URL || ''
const isSupabase =
  databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')
const connectionString = isSupabase
  ? resolveSupabaseConnectionString(databaseUrl)
  : databaseUrl
const usesSupabaseTxPooler = /pooler\.supabase\.com:6543/i.test(connectionString)

/**
 * Payload schema push deletes tables Drizzle does not own. Jeyjo core tables
 * (`customers`, `web_profiles`, `audit_log`, …) live in supabase/migrations and
 * must never be dropped. Opt in with PAYLOAD_DB_PUSH=true only on isolated DBs.
 */
const pushSchema = process.env.PAYLOAD_DB_PUSH === 'true'

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/DashboardKpisView#DashboardKpisView'],
      afterNavLinks: [
        '@/components/MfaGate#MfaGate',
        '@/components/CustomersAdminNavLink#CustomersAdminNavLink',
      ],
      views: {
        auditLog: {
          Component: '@/components/AuditLogView#AuditLogView',
          path: '/audit-log',
        },
        customersAdmin: {
          Component: '@/components/CustomersAdminView#CustomersAdminView',
          path: '/customers',
          meta: {
            title: 'Clientes tienda',
            description: 'Cuentas registradas en el storefront y validación RF-004',
          },
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
        quotesInbox: {
          Component: '@/components/QuotesInboxView#QuotesInboxView',
          path: '/quotes',
        },
        rmaInbox: {
          Component: '@/components/RmaInboxView#RmaInboxView',
          path: '/rma',
        },
        productReviewsInbox: {
          Component: '@/components/ProductReviewsInboxView#ProductReviewsInboxView',
          path: '/product-reviews',
        },
        catalogImport: {
          Component: '@/components/CatalogImportView#CatalogImportView',
          path: '/catalog-import',
        },
        skaiConfig: {
          Component: '@/components/SkaiConfigView#SkaiConfigView',
          path: '/skai-config',
        },
        analyticsConfig: {
          Component: '@/components/AnalyticsConfigView#AnalyticsConfigView',
          path: '/analytics-config',
        },
        newsletterSubscribers: {
          Component: '@/components/NewsletterSubscribersView#NewsletterSubscribersView',
          path: '/newsletter-subscribers',
        },
        systemConfig: {
          Component: '@/components/SystemConfigHubView#SystemConfigHubView',
          path: '/system-config',
        },
      },
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Categories,
    Brands,
    Suppliers,
    Media,
    Quotes,
    RmaIncidents,
    ProductReviews,
    Coupons,
    B2bCatalogDownloads,
    CustomerDocuments,
    SpecialPrices,
    GroupOffers,
  ],
  cors: corsOrigins,
  csrf: corsOrigins,
  db: postgresAdapter({
    pool: {
      connectionString,
      // Session pooler: keep max low. Tx pooler (dev default): allow a few more clients.
      ...(isSupabase
        ? {
            max: Number(
              process.env.PAYLOAD_DB_POOL_MAX ?? (usesSupabaseTxPooler ? 5 : 2),
            ),
            idleTimeoutMillis: 20_000,
            connectionTimeoutMillis: 10_000,
            ssl: { rejectUnauthorized: false },
          }
        : {}),
    },
    push: pushSchema,
    migrationDir: path.resolve(dirname, '../migrations'),
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
          enabledCollections: ['products'],
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
    ...customersAdminEndpoints,
    bulkSeoTemplateEndpoint,
    dashboardSummaryEndpoint,
    pimHealthEndpoint,
    ...catalogImportEndpoints,
    ...customerDocumentsEndpoints,
    evaContextEndpoint,
    evaOrdersWebhookEndpoint,
    skaiStatusEndpoint,
    skaiTestTokenEndpoint,
    analyticsStatusEndpoint,
    analyticsStatusUpdateEndpoint,
    ...newsletterEndpoints,
  ],
  globals: [
    Home,
    SystemSettings,
    PaymentSettings,
    MarketingSettings,
    NewsletterSettings,
    SkaiSettings,
    AnalyticsSettings,
  ],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    try {
      await preloadExcelAdapter()
    } catch (e) {
      console.warn('[ERP] Excel adapter preload skipped:', e instanceof Error ? e.message : e)
    }

    try {
      const existing = await payload.findGlobal({ slug: 'systemSettings', overrideAccess: true })
      if (!existing?.updatedAt) {
        await payload.updateGlobal({
          slug: 'systemSettings',
          data: SYSTEM_SETTINGS_SEED,
          overrideAccess: true,
        })
      }
    } catch (e) {
      console.warn('[SystemSettings] Seed skipped:', e instanceof Error ? e.message : e)
    }

    for (const col of qdrantCollections) {
      try {
        await ensureCollection(col.name, col.vectorSize)
      } catch {
        console.warn(`[Qdrant] No se pudo crear la colección "${col.name}" — Qdrant no está disponible?`)
      }
    }
  },
})
