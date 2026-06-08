import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'

import { enrichmentFields } from '@/collections/Products/enrichmentFields'
import { erpFields } from '@/collections/Products/erpFields'
import { erpProductBeforeChange } from '@/collections/Products/erpHooks'
import { stockProductBeforeChange } from '@/collections/Products/stockHooks'
import { manualStockAfterChange } from '@/collections/Products/manualStockHooks'
import { productSlugHooks } from '@/collections/Products/hooks'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import {
  staffCreateAccess,
  staffDeleteAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { productSearchEventHooks } from '@/hooks/searchEventHooks'

const productAuditHooks = createAuditHooks({ collection: 'products' })

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  labels: {
    singular: 'Producto',
    plural: 'Productos',
  },
  access: {
    ...defaultCollection?.access,
    create: staffCreateAccess('products'),
    read: defaultCollection?.access?.read,
    update: staffUpdateAccess('products'),
    delete: staffDeleteAccess('products'),
  },
  admin: {
    ...defaultCollection?.admin,
    group: 'Catálogo',
    hidden: ({ user }) => isCollectionHidden(user, 'products'),
    defaultColumns: ['title', 'skuErp', 'supplier', '_status'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    skuErp: true,
    supplier: true,
    providerImageUrl: true,
    ownImage: true,
    additionalImages: {
      image: true,
    },
    meta: {
      title: true,
      description: true,
      image: true,
    },
  },
  hooks: {
    ...defaultCollection?.hooks,
    beforeValidate: [...(defaultCollection?.hooks?.beforeValidate ?? []), ...productSlugHooks],
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange ?? []),
      ...productAuditHooks.beforeChange,
      erpProductBeforeChange,
      stockProductBeforeChange,
      ({ data }) => {
        if (data) {
          data.enableVariants = false
        }
        return data
      },
    ],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange ?? []),
      manualStockAfterChange,
      ...productSearchEventHooks.afterChange,
      ...productAuditHooks.afterChange,
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete ?? []),
      ...productSearchEventHooks.afterDelete,
      ...productAuditHooks.afterDelete,
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Marketing / SEO',
          fields: enrichmentFields,
        },
        {
          label: 'Datos comerciales',
          fields: erpFields,
        },
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              label: 'Descripción (template)',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              required: false,
              admin: { hidden: true },
            },
            {
              name: 'gallery',
              type: 'array',
              admin: { hidden: true },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: unknown) => {
                        if (typeof item === 'object' && item && 'id' in item) {
                          return (item as { id: DefaultDocumentIDType }).id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },
            {
              name: 'layout',
              type: 'blocks',
              admin: { hidden: true },
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO Preview',
          admin: {
            description:
              'Título, descripción e imagen para Open Graph, Twitter y datos estructurados. Si no hay meta.image, el storefront usa la imagen de catálogo (propia o proveedor).',
          },
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      label: 'Proveedor',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
      label: 'Categorías',
    },
    slugField(),
  ],
})
