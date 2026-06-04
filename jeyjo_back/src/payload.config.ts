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
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'
import { ensureCollection } from '@/lib/qdrant'
import { qdrantCollections } from '@/lib/qdrant-collections'
import {nodemailerAdapter} from "@payloadcms/email-nodemailer";

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

const corsOrigins = [
  serverURL,
  'http://localhost:3000',
].filter(Boolean)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Pages, Categories, Media],
  cors: corsOrigins,
  csrf: corsOrigins,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
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
    transportOptions:
      process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY
        ? {
            host: 'localhost',
            port: 1025,
            secure: false,
            ignoreTLS: true,
          }
        : {
            host: process.env.RESEND_SMTP_HOST,
            port: Number(process.env.RESEND_SMTP_PORT),
            auth: {
              user: 'resend',
              pass: process.env.RESEND_API_KEY,
            },
            secure: false,
          },
    defaultFromName: process.env.RESEND_FROM_NAME || 'Jeyjo',
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@tudominio.com',
  }),
  endpoints: [],
  globals: [Header, Footer],
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
