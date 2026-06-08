import type { CollectionSlug, Payload, PayloadRequest, File } from 'payload'

import { seedCatalogDatabase } from './seed-catalog-database'
import { seedStaffUsers } from './staff-users'
import { seedDashboardFixtures } from './dashboard-fixtures'
import { seedEvaPendingOrder } from './eva-order'
import { seedB2bCatalogDownloads } from './b2b-catalog-downloads'
import { seedMarketingCoupons } from './marketing-coupons'
import { seedSampleQuotes } from './sample-quotes'
import { productHatData } from './product-hat'
import { productTshirtData } from './product-tshirt'
import { imageHatData } from './image-hat'
import { imageTshirtBlackData } from './image-tshirt-black'
import { imageTshirtWhiteData } from './image-tshirt-white'
import { imageHero1Data } from './image-hero-1'
import { Address, Transaction } from '@/payload-types'

const collections: CollectionSlug[] = [
  'categories',
  'brands',
  'suppliers',
  'media',
  'products',
  'carts',
  'transactions',
  'addresses',
  'orders',
  'quotes',
]

const categories = ['Accessories', 'T-Shirts', 'Hats']

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all([
    payload.updateGlobal({
      slug: 'home',
      data: {
        promoBanners: [],
        featuredCategories: [],
        topSalesB2c: [],
        topSalesB2b: [],
        ecoHighlight: [],
      },
      depth: 0,
      context: { disableRevalidate: true },
    }),
  ])

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'customer@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [imageHatBuffer, imageTshirtBlackBuffer, imageTshirtWhiteBuffer, heroBuffer] =
    await Promise.all([
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/hat-logo.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/tshirt-black.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/tshirt-white.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp',
      ),
    ])

  const [
    customer,
    imageHat,
    imageTshirtBlack,
    imageTshirtWhite,
    imageHero,
    accessoriesCategory,
    tshirtsCategory,
    hatsCategory,
  ] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'media',
      data: imageHatData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtBlackData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtWhiteData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1Data,
      file: heroBuffer,
    }),
    ...categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: {
          title: category,
          slug: category,
        },
      }),
    ),
  ])

  payload.logger.info(`— Seeding products...`)

  const productHat = await payload.create({
    collection: 'products',
    depth: 0,
    data: productHatData({
      galleryImage: imageHat,
      metaImage: imageHat,
      categories: [hatsCategory],
      relatedProducts: [],
    }),
  })

  const productTshirt = await payload.create({
    collection: 'products',
    depth: 0,
    data: productTshirtData({
      galleryImages: [{ image: imageTshirtBlack }, { image: imageTshirtWhite }],
      metaImage: imageTshirtBlack,
      contentImage: imageHero,
      categories: [tshirtsCategory],
      relatedProducts: [productHat],
    }),
  })

  payload.logger.info(`— Seeding addresses...`)

  const customerUSAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  })

  const customerUKAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  // Stripe fields optional when paymentMethods is empty (template seed)
  const pendingTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'pending',
      billingAddress: baseAddressUSData,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  const succeededTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'succeeded',
      billingAddress: baseAddressUSData,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  let succeededTransactionID: number | string = succeededTransaction.id

  if (payload.db.defaultIDType === 'text') {
    succeededTransactionID = `"${succeededTransactionID}"`
  }

  payload.logger.info(`— Seeding carts...`)

  // This cart is open as it's created now
  const openCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      items: [
        {
          product: productTshirt.id,
          quantity: 1,
        },
      ],
    },
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  // Cart is abandoned because it was created long in the past
  const abandonedCart = await payload.create({
    collection: 'carts',
    data: {
      currency: 'USD',
      createdAt: oldTimestamp,
      items: [
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
    },
  })

  // Cart is purchased because it has a purchasedAt date
  const completedCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      purchasedAt: new Date().toISOString(),
      subtotal: 7499,
      items: [
        {
          product: productTshirt.id,
          quantity: 1,
        },
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
    },
  })

  let completedCartID: number | string = completedCart.id

  if (payload.db.defaultIDType === 'text') {
    completedCartID = `"${completedCartID}"`
  }

  payload.logger.info(`— Seeding orders...`)

  const orderInCompleted = await payload.create({
    collection: 'orders',
    data: {
      origin: 'b2c',
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          quantity: 1,
        },
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      transactions: [succeededTransaction.id],
    },
  })

  const orderInProcessing = await payload.create({
    collection: 'orders',
    data: {
      origin: 'b2c',
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          quantity: 1,
        },
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      transactions: [succeededTransaction.id],
    },
  })

  await seedCatalogDatabase({
    payload,
    req,
    options: { reset: false, heroMediaId: imageHero.id },
  })
  await seedStaffUsers(payload)
  await seedEvaPendingOrder({ payload, req })
  await seedDashboardFixtures(payload)
  await seedSampleQuotes({ payload, req })
  await seedMarketingCoupons(payload)
  await seedB2bCatalogDownloads(payload)

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
