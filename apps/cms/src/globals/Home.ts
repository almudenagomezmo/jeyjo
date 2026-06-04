import type { GlobalConfig } from 'payload'

import { contentStaffUpdate } from '@/access/contentStaffUpdate'

const segmentOptions = [
  { label: 'B2C', value: 'b2c' },
  { label: 'B2B', value: 'b2b' },
  { label: 'Ambos', value: 'both' },
] as const

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home (tienda)',
  admin: {
    group: 'Personalización',
  },
  access: {
    read: () => true,
    update: contentStaffUpdate,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const banners = data?.promoBanners
        if (!Array.isArray(banners)) return data

        for (let i = 0; i < banners.length; i++) {
          const banner = banners[i]
          if (!banner?.startAt || !banner?.endAt) continue
          const start = new Date(banner.startAt)
          const end = new Date(banner.endAt)
          if (end < start) {
            throw new Error(
              `Banner promocional ${i + 1}: la fecha de fin debe ser igual o posterior a la de inicio.`,
            )
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'promoBanners',
      type: 'array',
      label: 'Banners promocionales',
      maxRows: 12,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagen',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          label: 'Enlace destino',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Texto alternativo',
        },
        {
          name: 'segment',
          type: 'select',
          label: 'Segmento',
          required: true,
          defaultValue: 'both',
          options: [...segmentOptions],
        },
        {
          name: 'startAt',
          type: 'date',
          label: 'Inicio',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endAt',
          type: 'date',
          label: 'Fin',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'sortOrder',
          type: 'number',
          label: 'Orden',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'featuredCategories',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categorías destacadas',
      hasMany: true,
      maxRows: 6,
    },
    {
      name: 'topSalesB2c',
      type: 'relationship',
      relationTo: 'products',
      label: 'Top ventas B2C',
      hasMany: true,
      maxRows: 12,
    },
    {
      name: 'topSalesB2b',
      type: 'relationship',
      relationTo: 'products',
      label: 'Top ventas B2B',
      hasMany: true,
      maxRows: 12,
    },
    {
      name: 'ecoHighlight',
      type: 'relationship',
      relationTo: 'products',
      label: 'Eco / sostenibilidad',
      hasMany: true,
      maxRows: 12,
    },
  ],
}
