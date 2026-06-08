import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import { Product } from '@/payload-types'
import { OrdersCollectionOverride } from '@/collections/Orders'
import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { getServerSideURL } from '@/utilities/getURL'

const isSupabaseConfigured =
  process.env.SUPABASE_ENDPOINT &&
  !process.env.SUPABASE_ENDPOINT.includes('xxxx') &&
  process.env.SUPABASE_ACCESS_KEY_ID &&
  !process.env.SUPABASE_ACCESS_KEY_ID.includes('tu_') &&
  process.env.SUPABASE_SECRET_ACCESS_KEY &&
  !process.env.SUPABASE_SECRET_ACCESS_KEY.includes('tu_')

const isStripeConfigured =
  Boolean(process.env.STRIPE_SECRET_KEY) &&
  process.env.STRIPE_SECRET_KEY !== 'sk_test_' &&
  process.env.STRIPE_SECRET_KEY!.length > 12 &&
  Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_test_' &&
  Boolean(process.env.STRIPE_WEBHOOKS_SIGNING_SECRET) &&
  process.env.STRIPE_WEBHOOKS_SIGNING_SECRET !== 'whsec_'

const storefrontBase = () =>
  process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
  process.env.STOREFRONT_URL?.trim() ||
  getServerSideURL()

const generateTitle: GenerateTitle<Product> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Jeyjo` : 'Jeyjo'
}

const generateURL: GenerateURL<Product> = ({ doc }) => {
  const base = storefrontBase().replace(/\/$/, '')
  return doc?.slug ? `${base}/p/${doc.slug}` : base
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    /** Jeyjo uses erpStock + stockIndicator (RF-005), not Payload template inventory. */
    inventory: false,
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: OrdersCollectionOverride,
    },
    payments: {
      paymentMethods: isStripeConfigured
        ? [
            stripeAdapter({
              secretKey: process.env.STRIPE_SECRET_KEY!,
              publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
              webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
            }),
          ]
        : [],
    },
    products: {
      /** Jeyjo uses ERP pricing; no Payload template variants or USD list prices. */
      variants: false,
      productsCollectionOverride: ProductsCollection,
    },
  }),
  ...(isSupabaseConfigured
    ? [
        s3Storage({
          collections: {
            media: {
              prefix: 'media',
            },
          },
          bucket: process.env.SUPABASE_BUCKET || 'catalog-media',
          config: {
            endpoint: process.env.SUPABASE_ENDPOINT!,
            region: process.env.SUPABASE_REGION || 'us-east-1',
            credentials: {
              accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
              secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
          },
        }),
      ]
    : []),
]
