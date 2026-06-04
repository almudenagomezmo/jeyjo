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
import { productSlugHooks } from '@/collections/Products/hooks'
import { auditLogHooksForCollection } from '@/hooks/auditLogHooks'
import { productSearchEventHooks } from '@/hooks/searchEventHooks'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  labels: {
    singular: 'Producto',
    plural: 'Productos',
  },
  admin: {
    ...defaultCollection?.admin,
    group: 'Catálogo',
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
    metaDescription: true,
    providerImageUrl: true,
    ownImage: true,
    meta: true,
  },
  hooks: {
    ...defaultCollection?.hooks,
    beforeValidate: [...(defaultCollection?.hooks?.beforeValidate ?? []), ...productSlugHooks],
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange ?? []),
      ({ data }) => {
        if (data) {
          data.enableVariants = false
        }
        return data
      },
    ],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange ?? []),
      ...productSearchEventHooks.afterChange,
      ...auditLogHooksForCollection('products').afterChange,
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete ?? []),
      ...productSearchEventHooks.afterDelete,
      ...auditLogHooksForCollection('products').afterDelete,
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
          label: 'Datos ERP',
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
